<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

final class UpdateGeneratedMediaPathsToPng extends Command
{
    protected $signature = 'autoteka:media:update-generated-paths-to-png {--dry-run : Только показать, что будет изменено}';

    protected $description = 'Обновляет в SQLite пути generated/*.svg на generated/*.png и подготавливает mirror-файлы для preview в MoonShine';

    public function handle(): int
    {
        $disk = Storage::disk((string) config('autoteka.media.disk'));
        $dryRun = (bool) $this->option('dry-run');

        $thumbDir = trim((string) config('autoteka.media.shop_thumb_dir'), '/');
        $galleryDir = trim((string) config('autoteka.media.shop_gallery_dir'), '/');

        $shopUpdates = DB::table('shop')
            ->select(['id', 'code', 'thumb_path'])
            ->where('thumb_path', 'like', 'generated/%')
            ->get()
            ->map(function (object $row) use ($disk, $thumbDir): ?array {
                $newPath = $this->toPngPath((string) $row->thumb_path);

                if (! $disk->exists($newPath)) {
                    return null;
                }

                return [
                    'id' => (int) $row->id,
                    'label' => (string) $row->code,
                    'old_path' => (string) $row->thumb_path,
                    'new_path' => $newPath,
                    'preview_path' => $thumbDir . '/' . $newPath,
                    'needs_db_update' => (string) $row->thumb_path !== $newPath,
                ];
            })
            ->filter()
            ->values();

        $galleryUpdates = DB::table('shop_gallery_image')
            ->join('shop', 'shop.id', '=', 'shop_gallery_image.shop_id')
            ->select([
                'shop_gallery_image.id',
                'shop.code',
                'shop_gallery_image.file_path',
            ])
            ->where('shop_gallery_image.file_path', 'like', 'generated/%')
            ->get()
            ->map(function (object $row) use ($disk, $galleryDir): ?array {
                $newPath = $this->toPngPath((string) $row->file_path);

                if (! $disk->exists($newPath)) {
                    return null;
                }

                return [
                    'id' => (int) $row->id,
                    'label' => (string) $row->code,
                    'old_path' => (string) $row->file_path,
                    'new_path' => $newPath,
                    'preview_path' => $galleryDir . '/' . $newPath,
                    'needs_db_update' => (string) $row->file_path !== $newPath,
                ];
            })
            ->filter()
            ->values();

        $this->info(sprintf(
            'Найдено к обработке: thumb_path=%d, gallery=%d',
            $shopUpdates->count(),
            $galleryUpdates->count(),
        ));

        $this->renderPreviewTable('thumb_path', $shopUpdates);
        $this->renderPreviewTable('gallery', $galleryUpdates);
        $this->line(sprintf(
            'Нужно обновить БД: thumb_path=%d, gallery=%d',
            $shopUpdates->where('needs_db_update', true)->count(),
            $galleryUpdates->where('needs_db_update', true)->count(),
        ));
        $this->line(sprintf(
            'Нужно подготовить preview-копии: thumb_path=%d, gallery=%d',
            $shopUpdates->filter(fn (array $row): bool => ! $disk->exists($row['preview_path']))->count(),
            $galleryUpdates->filter(fn (array $row): bool => ! $disk->exists($row['preview_path']))->count(),
        ));

        if ($dryRun) {
            $this->comment('Dry-run: изменения в БД не записаны.');

            return self::SUCCESS;
        }

        DB::transaction(function () use ($shopUpdates, $galleryUpdates, $disk): void {
            $shopUpdates->each(function (array $row) use ($disk): void {
                $this->ensurePreviewCopy($disk, $row['new_path'], $row['preview_path']);

                if ($row['needs_db_update']) {
                    DB::table('shop')
                        ->where('id', $row['id'])
                        ->update(['thumb_path' => $row['new_path']]);
                }
            });

            $galleryUpdates->each(function (array $row) use ($disk): void {
                $this->ensurePreviewCopy($disk, $row['new_path'], $row['preview_path']);

                if ($row['needs_db_update']) {
                    DB::table('shop_gallery_image')
                        ->where('id', $row['id'])
                        ->update(['file_path' => $row['new_path']]);
                }
            });
        });

        $this->info('Обновление SQLite и подготовка preview завершены.');

        return self::SUCCESS;
    }

    private function toPngPath(string $path): string
    {
        return preg_replace('/\.svg$/i', '.png', $path) ?? $path;
    }

    private function ensurePreviewCopy($disk, string $sourcePath, string $targetPath): void
    {
        if ($disk->exists($targetPath)) {
            return;
        }

        $directory = dirname($targetPath);
        if ($directory !== '.' && ! $disk->exists($directory)) {
            $disk->makeDirectory($directory);
        }

        $disk->copy($sourcePath, $targetPath);
    }

    /**
     * @param Collection<int, array{id:int,label:string,old_path:string,new_path:string,preview_path:string,needs_db_update:bool}> $rows
     */
    private function renderPreviewTable(string $section, Collection $rows): void
    {
        if ($rows->isEmpty()) {
            $this->line(sprintf('%s: нет строк для обработки.', $section));

            return;
        }

        $this->table(
            ['scope', 'id', 'entity', 'old', 'new', 'preview'],
            $rows
                ->take(10)
                ->map(fn (array $row): array => [
                    $section,
                    $row['id'],
                    $row['label'],
                    $row['old_path'],
                    $row['new_path'],
                    $row['preview_path'],
                ])
                ->all(),
        );

        if ($rows->count() > 10) {
            $this->line(sprintf('%s: ещё %d строк не показано.', $section, $rows->count() - 10));
        }
    }
}
