<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Handlers;

use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotion;
use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotionImage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use ShopOperator\Models\Promotion;
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

            return $promotion->fresh(['shop', 'galleryImages']) ?? $promotion;
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
}
