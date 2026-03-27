<?php

declare(strict_types=1);

namespace Autoteka\DemoPromotion\Support;

use Illuminate\Support\Facades\Storage;
use RuntimeException;
use ShopOperator\Support\Media\UploadFileNameGenerator;

final class PromotionImageStager
{
    /**
     * @var array<int, string>|null
     */
    private ?array $sourceFiles = null;

    /**
     * @var array<int, string>
     */
    private array $tempFiles = [];

    /**
     * @return array{file_path: string, original_name: string}
     */
    public function stageRandomImage(): array
    {
        $diskName = (string) config('autoteka.media.disk');
        $disk = Storage::disk($diskName);
        $sourcePath = $this->pickRandomSourcePath();
        $sourceAbsolutePath = $disk->path($sourcePath);
        $tempName = sprintf(
            'demo-promo-%s-%s.%s',
            date('YmdHis'),
            bin2hex(random_bytes(5)),
            pathinfo($sourcePath, PATHINFO_EXTENSION),
        );
        $tempPath = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $tempName;

        if (! copy($sourceAbsolutePath, $tempPath)) {
            throw new RuntimeException("Не удалось скопировать исходное изображение [$sourcePath] во временную папку.");
        }

        $this->tempFiles[] = $tempPath;

        $storedName = UploadFileNameGenerator::generateFromName($tempName);
        $storedRelativePath = trim((string) config('autoteka.media.promotion_gallery_dir'), '/') . '/' . $storedName;
        $contents = file_get_contents($tempPath);

        if ($contents === false) {
            throw new RuntimeException("Не удалось прочитать временный файл [$tempPath].");
        }

        $disk->put($storedRelativePath, $contents);

        return [
            'file_path' => $storedRelativePath,
            'original_name' => basename($tempPath),
        ];
    }

    public function cleanup(): void
    {
        foreach ($this->tempFiles as $tempPath) {
            if (is_file($tempPath)) {
                @unlink($tempPath);
            }
        }

        $this->tempFiles = [];
    }

    private function pickRandomSourcePath(): string
    {
        if ($this->sourceFiles === null) {
            $disk = Storage::disk((string) config('autoteka.media.disk'));
            $dir = trim((string) config('autoteka.media.shop_gallery_dir'), '/');
            $files = $disk->files($dir);

            $this->sourceFiles = array_values(array_filter(
                $files,
                static function (string $path): bool {
                    $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

                    return in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true);
                },
            ));
        }

        if ($this->sourceFiles === [] || $this->sourceFiles === null) {
            throw new RuntimeException('Не найдено ни одного исходного изображения в shops/gallery.');
        }

        return $this->sourceFiles[array_rand($this->sourceFiles)];
    }
}
