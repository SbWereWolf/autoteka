<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Handlers;

use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotion;
use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotionGalleryVideo;
use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotionImage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use ShopOperator\Models\Promotion;
use ShopOperator\Models\PromotionGalleryVideo;
use ShopOperator\Models\PromotionImage;
use ShopOperator\Models\Shop;
use ShopOperator\Support\Media\UploadOriginalNameStore;
use ShopOperator\Support\Promotion\PromotionCodeGenerator;

final class SavePromotionResourceHandler
{
    public function __invoke(Promotion $promotion, array $data): Promotion
    {
        $schema = new SchemaPromotion();
        $shop = $this->resolveShop($promotion, $data);
        $title = $this->requiredString($data[$schema->title()] ?? null, 'title', 'Поле "Название" обязательно для акции.');
        $description = $this->requiredString($data[$schema->description()] ?? null, 'description', 'Поле "Описание" обязательно для акции.');
        $startDate = $this->requiredDateString($data[$schema->startDate()] ?? null, 'start_date');
        $endDate = $this->requiredDateString($data[$schema->endDate()] ?? null, 'end_date');

        if ($endDate < $startDate) {
            throw ValidationException::withMessages([
                $schema->endDate() => ['Дата окончания не может быть раньше даты начала.'],
            ]);
        }

        $uploadOriginalNames = app(UploadOriginalNameStore::class);

        return DB::transaction(function () use (
            $promotion,
            $data,
            $schema,
            $shop,
            $title,
            $description,
            $startDate,
            $endDate,
            $uploadOriginalNames,
        ): Promotion {
            $promotion->fill([
                $schema->shopId() => $shop->getKey(),
                $schema->code() => PromotionCodeGenerator::generate($promotion, $shop, $title),
                $schema->title() => $title,
                $schema->description() => $description,
                $schema->startDate() => $startDate,
                $schema->endDate() => $endDate,
                $schema->isPublished() => (bool) ($data[$schema->isPublished()] ?? false),
            ]);
            $promotion->save();

            $galleryEntries = $data['gallery_entries'] ?? request()->input('gallery_entries', []);

            $this->syncGallery(
                $promotion,
                $galleryEntries,
                $uploadOriginalNames,
            );
            $this->syncGalleryVideos(
                $promotion,
                $data['gallery_video_entries'] ?? request()->input('gallery_video_entries', []),
                $uploadOriginalNames,
            );

            return $promotion->fresh(['shop', 'galleryImages', 'galleryVideos']) ?? $promotion;
        });
    }

    private function resolveShop(Promotion $promotion, array $data): Shop
    {
        $shopId = $promotion->exists
            ? (int) $promotion->shop_id
            : (int) ($data[(new SchemaPromotion())->shopId()] ?? 0);

        if ($shopId <= 0) {
            throw ValidationException::withMessages([
                'shop_id' => ['Требуется валидный shop_id для создания акции.'],
            ]);
        }

        return Shop::query()->findOrFail($shopId);
    }

    private function syncGallery(
        Promotion $promotion,
        mixed $rows,
        UploadOriginalNameStore $uploadOriginalNames,
    ): void {
        $schema = new SchemaPromotionImage();
        $existing = $promotion->galleryImages()->get()->keyBy($schema->id());
        $keptIds = [];
        $disk = Storage::disk((string) config('autoteka.media.disk'));

        foreach (collect(is_iterable($rows) ? $rows : []) as $row) {
            if (! is_array($row)) {
                continue;
            }

            $filePath = trim((string) (
                $row[$schema->filePath()]
                ?? $row['hidden_' . $schema->filePath()]
                ?? ''
            ));
            if ($filePath === '') {
                continue;
            }

            $image = null;
            $id = (int) ($row[$schema->id()] ?? 0);
            if ($id > 0) {
                $image = $existing->get($id);
            }

            $oldPath = $image?->file_path;

            if (! $image instanceof PromotionImage) {
                $image = new PromotionImage();
                $image->setAttribute($schema->promotionId(), $promotion->getKey());
            }

            $originalName = $uploadOriginalNames->pullByPath($filePath)
                ?? $this->nullableString($row[$schema->originalName()] ?? null)
                ?? $image->original_name;

            $image->fill([
                $schema->filePath() => $filePath,
                $schema->originalName() => $originalName,
                $schema->sort() => (int) ($row[$schema->sort()] ?? 0),
                $schema->isPublished() => (bool) ($row[$schema->isPublished()] ?? true),
            ]);
            $image->save();

            if ($oldPath && $oldPath !== $image->file_path) {
                $disk->delete($oldPath);
            }

            $keptIds[] = $image->getKey();
        }

        $toDelete = $promotion->galleryImages()
            ->when($keptIds !== [], fn ($query) => $query->whereNotIn($schema->id(), $keptIds))
            ->get();

        foreach ($toDelete as $image) {
            $disk->delete($image->file_path);
            $image->delete();
        }
    }

    private function requiredString(mixed $value, string $key, string $message): string
    {
        $result = trim((string) $value);

        if ($result === '') {
            throw ValidationException::withMessages([
                $key => [$message],
            ]);
        }

        return $result;
    }

    private function requiredDateString(mixed $value, string $key): string
    {
        $result = trim((string) $value);

        if ($result === '' || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $result)) {
            throw ValidationException::withMessages([
                $key => ['Укажите корректную дату в формате YYYY-MM-DD.'],
            ]);
        }

        return $result;
    }

    private function nullableString(mixed $value): ?string
    {
        $result = trim((string) $value);

        return $result === '' ? null : $result;
    }

    private function syncGalleryVideos(
        Promotion $promotion,
        mixed $rows,
        UploadOriginalNameStore $uploadOriginalNames,
    ): void {
        $schema = new SchemaPromotionGalleryVideo();
        $existing = $promotion->galleryVideos()->get()->keyBy($schema->id());
        $keptIds = [];
        $disk = Storage::disk((string) config('autoteka.media.disk'));

        foreach (collect(is_iterable($rows) ? $rows : []) as $row) {
            if (! is_array($row)) {
                continue;
            }

            $filePath = trim((string) (
                $row[$schema->filePath()]
                ?? $row['hidden_' . $schema->filePath()]
                ?? ''
            ));
            $posterPath = trim((string) (
                $row[$schema->posterPath()]
                ?? $row['hidden_' . $schema->posterPath()]
                ?? ''
            ));

            if ($filePath === '' && $posterPath === '') {
                continue;
            }

            if ($filePath === '' || $posterPath === '') {
                throw ValidationException::withMessages([
                    'gallery_video_entries' => ['Для каждого видео галереи акции необходимо загрузить и видеофайл, и poster.'],
                ]);
            }

            if (! array_key_exists($schema->sort(), $row) || trim((string) ($row[$schema->sort()] ?? '')) === '') {
                throw ValidationException::withMessages([
                    'gallery_video_entries' => ['Для каждого видео галереи акции необходимо явно указать sort.'],
                ]);
            }

            $video = null;
            $id = (int) ($row[$schema->id()] ?? 0);
            if ($id > 0) {
                $video = $existing->get($id);
            }

            $oldVideoPath = $video?->file_path;
            $oldPosterPath = $video?->poster_path;

            if (! $video instanceof PromotionGalleryVideo) {
                $video = new PromotionGalleryVideo();
                $video->setAttribute($schema->promotionId(), $promotion->getKey());
            }

            $video->fill([
                $schema->filePath() => $filePath,
                $schema->originalName() => $uploadOriginalNames->pullByPath($filePath)
                    ?? $this->nullableString($row[$schema->originalName()] ?? null)
                    ?? $video->original_name,
                $schema->posterPath() => $posterPath,
                $schema->posterOriginalName() => $uploadOriginalNames->pullByPath($posterPath)
                    ?? $this->nullableString($row[$schema->posterOriginalName()] ?? null)
                    ?? $video->poster_original_name,
                $schema->mime() => $this->resolveVideoMime($row[$schema->mime()] ?? null, $filePath),
                $schema->sort() => (int) ($row[$schema->sort()] ?? 0),
                $schema->isPublished() => (bool) ($row[$schema->isPublished()] ?? true),
            ]);
            $video->save();

            if ($oldVideoPath && $oldVideoPath !== $video->file_path) {
                $disk->delete($oldVideoPath);
            }

            if ($oldPosterPath && $oldPosterPath !== $video->poster_path) {
                $disk->delete($oldPosterPath);
            }

            $keptIds[] = $video->getKey();
        }

        $toDelete = $promotion->galleryVideos()
            ->when($keptIds !== [], fn ($query) => $query->whereNotIn($schema->id(), $keptIds))
            ->get();

        foreach ($toDelete as $video) {
            $disk->delete([$video->file_path, $video->poster_path]);
            $video->delete();
        }
    }

    private function resolveVideoMime(mixed $value, string $filePath): string
    {
        $mime = match (strtolower(pathinfo($filePath, PATHINFO_EXTENSION))) {
            'webm' => 'video/webm',
            'mp4' => 'video/mp4',
            default => throw ValidationException::withMessages([
                'gallery_video_entries' => ['Неподдерживаемый формат видео. Разрешены только mp4 и webm.'],
            ]),
        };

        $provided = trim((string) $value);
        if ($provided !== '' && $provided !== $mime) {
            throw ValidationException::withMessages([
                'gallery_video_entries' => ['Указанный mime видео не соответствует расширению файла.'],
            ]);
        }

        return $mime;
    }
}
