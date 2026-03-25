<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Handlers;

use ShopOperator\Models\City;
use ShopOperator\Models\Shop;
use ShopOperator\Models\ShopContact;
use ShopOperator\Models\ShopGalleryImage;
use ShopOperator\Models\ShopSchedule;
use ShopOperator\Support\Media\UploadOriginalNameStore;
use ShopOperator\Support\Shop\ShopContactUniqueness;
use ShopOperator\Support\Shop\ShopPayloadAssertions;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShop;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopCategory;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopContact;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopFeature;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopGalleryImage;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopSchedule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

final class SaveShopResourceHandler
{
    public function __invoke(Shop $shop, array $data): Shop
    {
        $this->validateRequiredFields($data);
        $this->validateCategoryFeatureLinkRows($data);

        $uploadOriginalNames = app(UploadOriginalNameStore::class);

        return DB::transaction(function () use ($shop, $data, $uploadOriginalNames): Shop {
            $schShop = new SchemaShop();

            $shop->fill([
                $schShop->code() => $data[$schShop->code()] ?? '',
                $schShop->title() => $data[$schShop->title()] ?? '',
                $schShop->sort() => (int) ($data[$schShop->sort()] ?? 0),
                $schShop->cityId() => (int) ($data[$schShop->cityId()] ?? 0),
                $schShop->description() => (string) ($data[$schShop->description()] ?? ''),
                $schShop->siteUrl() => (string) ($data[$schShop->siteUrl()] ?? ''),
                $schShop->slogan() => $this->nullableString($data[$schShop->slogan()] ?? null),
                $schShop->latitude() => $this->nullableFloat($data[$schShop->latitude()] ?? null),
                $schShop->longitude() => $this->nullableFloat($data[$schShop->longitude()] ?? null),
                $schShop->scheduleNote() => $this->nullableString($data[$schShop->scheduleNote()] ?? null),
                $schShop->thumbPath() => $this->nullableString($data[$schShop->thumbPath()] ?? null),
                $schShop->thumbOriginalName() => $uploadOriginalNames->pullByPath(
                    $this->nullableString($data[$schShop->thumbPath()] ?? null),
                ) ?? $shop->thumb_original_name,
                $schShop->isPublished() => (bool) ($data[$schShop->isPublished()] ?? false),
            ]);

            $originalThumb = $shop->getOriginal($schShop->thumbPath());
            $shop->save();

            if ($originalThumb && $originalThumb !== $shop->thumb_path) {
                Storage::disk(config('autoteka.media.disk'))->delete($originalThumb);
            }

            $this->syncCategoryLinks($shop, $data['category_links'] ?? []);
            $this->syncFeatureLinks($shop, $data['feature_links'] ?? []);
            $this->syncContacts($shop, $data['contact_entries'] ?? []);
            $this->syncGallery($shop, $data['gallery_entries'] ?? [], $uploadOriginalNames);
            $this->syncSchedules($shop, $data['schedule_entries'] ?? []);

            return $shop->fresh([
                'city',
                'categories',
                'features',
                'contacts.contactType',
                'galleryImages',
                'schedules',
            ]) ?? $shop;
        });
    }

    private function syncCategoryLinks(Shop $shop, mixed $rows): void
    {
        $p = new SchemaShopCategory();
        $sync = [];

        foreach (collect(is_iterable($rows) ? $rows : []) as $row) {
            if (! is_array($row)) {
                continue;
            }

            $id = (int) ($row[$p->categoryId()] ?? 0);
            if ($id <= 0) {
                continue;
            }

            $sync[$id] = [$p->isPublished() => (bool) $row[$p->isPublished()]];
        }

        $shop->categories()->sync($sync);
    }

    private function syncFeatureLinks(Shop $shop, mixed $rows): void
    {
        $p = new SchemaShopFeature();
        $sync = [];

        foreach (collect(is_iterable($rows) ? $rows : []) as $row) {
            if (! is_array($row)) {
                continue;
            }

            $id = (int) ($row[$p->featureId()] ?? 0);
            if ($id <= 0) {
                continue;
            }

            $sync[$id] = [$p->isPublished() => (bool) $row[$p->isPublished()]];
        }

        $shop->features()->sync($sync);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function validateCategoryFeatureLinkRows(array $data): void
    {
        $pCat = new SchemaShopCategory();
        $pFeat = new SchemaShopFeature();
        $this->assertPivotLinkRowsHavePublishedFlag($data['category_links'] ?? [], $pCat->categoryId(), 'category_links', $pCat);
        $this->assertPivotLinkRowsHavePublishedFlag($data['feature_links'] ?? [], $pFeat->featureId(), 'feature_links', $pFeat);
    }

    private function assertPivotLinkRowsHavePublishedFlag(
        mixed $rows,
        string $idKey,
        string $errorKey,
        SchemaShopCategory|SchemaShopFeature $pivotSch,
    ): void {
        foreach (is_iterable($rows) ? $rows : [] as $row) {
            if (! is_array($row)) {
                continue;
            }

            $id = (int) ($row[$idKey] ?? 0);
            if ($id <= 0) {
                continue;
            }

            if (! array_key_exists($pivotSch->isPublished(), $row)) {
                throw ValidationException::withMessages([
                    $errorKey => ['Для каждой выбранной связи необходимо явно указать «Опубликован».'],
                ]);
            }
        }
    }

    private function syncContacts(Shop $shop, mixed $rows): void
    {
        $c = new SchemaShopContact();

        $desired = collect(is_iterable($rows) ? $rows : [])
            ->map(static function (mixed $row) use ($c): ?array {
                if (! is_array($row)) {
                    return null;
                }

                $typeId = (int) ($row[$c->contactTypeId()] ?? 0);
                $value = ShopContactUniqueness::normalizeValue($row[$c->value()] ?? '');
                if ($typeId === 0 || $value === '') {
                    return null;
                }

                return [
                    $c->id() => isset($row[$c->id()]) ? (int) $row[$c->id()] : null,
                    $c->contactTypeId() => $typeId,
                    $c->value() => $value,
                    $c->sort() => (int) ($row[$c->sort()] ?? 0),
                    $c->isPublished() => (bool) ($row[$c->isPublished()] ?? true),
                ];
            })
            ->filter()
            ->values();

        ShopContactUniqueness::assertUnique($desired->all());

        $existing = $shop->contacts()->get()->keyBy($c->id());
        $keptIds = [];

        foreach ($desired as $item) {
            $contact = $item[$c->id()] ? $existing->get($item[$c->id()]) : null;
            if (! $contact instanceof ShopContact) {
                $contact = new ShopContact();
                $contact->setAttribute($c->shopId(), $shop->getKey());
            }

            $contact->fill([
                $c->contactTypeId() => $item[$c->contactTypeId()],
                $c->value() => $item[$c->value()],
                $c->sort() => $item[$c->sort()],
                $c->isPublished() => $item[$c->isPublished()],
            ]);
            $contact->save();
            $keptIds[] = $contact->getKey();
        }

        if ($keptIds === []) {
            $shop->contacts()->delete();

            return;
        }

        $shop->contacts()->whereNotIn($c->id(), $keptIds)->delete();
    }

    private function syncGallery(Shop $shop, mixed $rows, UploadOriginalNameStore $uploadOriginalNames): void
    {
        $g = new SchemaShopGalleryImage();

        $desired = collect(is_iterable($rows) ? $rows : [])
            ->map(function (mixed $row) use ($uploadOriginalNames, $g): ?array {
                if (! is_array($row)) {
                    return null;
                }

                $filePath = trim((string) ($row[$g->filePath()] ?? ''));
                if ($filePath === '') {
                    return null;
                }

                return [
                    $g->id() => isset($row[$g->id()]) ? (int) $row[$g->id()] : null,
                    $g->filePath() => $filePath,
                    $g->originalName() => $uploadOriginalNames->pullByPath($filePath),
                    $g->sort() => (int) ($row[$g->sort()] ?? 0),
                    $g->isPublished() => (bool) ($row[$g->isPublished()] ?? true),
                ];
            })
            ->filter()
            ->values();

        $existing = $shop->galleryImages()->get()->keyBy($g->id());
        $keptIds = [];
        $disk = Storage::disk(config('autoteka.media.disk'));

        foreach ($desired as $item) {
            $image = $item[$g->id()] ? $existing->get($item[$g->id()]) : null;
            $oldPath = $image?->file_path;
            if (! $image instanceof ShopGalleryImage) {
                $image = new ShopGalleryImage();
                $image->setAttribute($g->shopId(), $shop->getKey());
            }

            $image->fill([
                $g->filePath() => $item[$g->filePath()],
                $g->originalName() => $item[$g->originalName()] ?? $image->original_name,
                $g->sort() => $item[$g->sort()],
                $g->isPublished() => $item[$g->isPublished()],
            ]);
            $image->save();

            if ($oldPath && $oldPath !== $image->file_path) {
                $disk->delete($oldPath);
            }

            $keptIds[] = $image->getKey();
        }

        $toDelete = $shop->galleryImages()
            ->when($keptIds !== [], fn ($query) => $query->whereNotIn($g->id(), $keptIds))
            ->get();

        foreach ($toDelete as $image) {
            $disk->delete($image->file_path);
            $image->delete();
        }
    }

    private function syncSchedules(Shop $shop, mixed $rows): void
    {
        $s = new SchemaShopSchedule();

        $desiredByWeekday = collect(is_iterable($rows) ? $rows : [])
            ->map(static function (mixed $row) use ($s): ?array {
                if (! is_array($row)) {
                    return null;
                }

                $weekday = (int) ($row[$s->weekday()] ?? 0);
                $timeFrom = trim((string) ($row[$s->timeFrom()] ?? ''));
                $timeTo = trim((string) ($row[$s->timeTo()] ?? ''));
                if ($weekday < 1 || $weekday > 7 || $timeFrom === '' || $timeTo === '') {
                    return null;
                }

                return [
                    $s->id() => isset($row[$s->id()]) ? (int) $row[$s->id()] : null,
                    $s->weekday() => $weekday,
                    $s->timeFrom() => $timeFrom,
                    $s->timeTo() => $timeTo,
                    $s->sort() => (int) ($row[$s->sort()] ?? 0),
                    $s->isPublished() => (bool) ($row[$s->isPublished()] ?? true),
                ];
            })
            ->filter()
            ->keyBy($s->weekday());

        $existing = $shop->schedules()->get()->keyBy($s->weekday());
        $keptIds = [];

        foreach ($desiredByWeekday as $weekday => $item) {
            $schedule = $existing->get($weekday);
            if (! $schedule instanceof ShopSchedule && $item[$s->id()]) {
                $schedule = ShopSchedule::query()
                    ->where($s->shopId(), $shop->getKey())
                    ->find($item[$s->id()]);
            }

            if (! $schedule instanceof ShopSchedule) {
                $schedule = new ShopSchedule();
                $schedule->setAttribute($s->shopId(), $shop->getKey());
            }

            $schedule->fill([
                $s->weekday() => $item[$s->weekday()],
                $s->timeFrom() => $item[$s->timeFrom()],
                $s->timeTo() => $item[$s->timeTo()],
                $s->sort() => $item[$s->sort()],
                $s->isPublished() => $item[$s->isPublished()],
            ]);
            $schedule->save();
            $keptIds[] = $schedule->getKey();
        }

        if ($keptIds === []) {
            $shop->schedules()->delete();

            return;
        }

        $shop->schedules()->whereNotIn($s->id(), $keptIds)->delete();
    }

    private function nullableString(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function nullableFloat(mixed $value): ?float
    {
        $value = trim((string) $value);

        return $value === '' ? null : (float) $value;
    }

    private function validateRequiredFields(array $data): void
    {
        $sch = new SchemaShop();
        $request = request();
        $hasRawInput = $request->all() !== [];

        if ($hasRawInput) {
            $rawTitle = $request->input($sch->title());
            if ($rawTitle === null || trim((string) $rawTitle) === '') {
                throw ValidationException::withMessages([
                    $sch->title() => ['Поле "Название" обязательно для магазина.'],
                ]);
            }

            $rawCityId = $request->input($sch->cityId());
            if ($rawCityId === null || trim((string) $rawCityId) === '') {
                throw ValidationException::withMessages([
                    $sch->cityId() => ['Поле "Город" обязательно для магазина.'],
                ]);
            }

            $rawSort = $request->input($sch->sort());
            if ($rawSort === null || trim((string) $rawSort) === '') {
                throw ValidationException::withMessages([
                    $sch->sort() => ['Поле «Порядок» (sort) обязательно для магазина.'],
                ]);
            }

            if (is_numeric($rawSort) && (int) $rawSort < 0) {
                throw ValidationException::withMessages([
                    $sch->sort() => ['Поле «Порядок» (sort) не может быть отрицательным.'],
                ]);
            }

            ShopPayloadAssertions::assertNullableNumeric(
                $request->input($sch->latitude()),
                $sch->latitude(),
                'Поле "Широта" должно быть числом.',
            );
            ShopPayloadAssertions::assertNullableNumeric(
                $request->input($sch->longitude()),
                $sch->longitude(),
                'Поле "Долгота" должно быть числом.',
            );
        }

        $title = trim((string) ($data[$sch->title()] ?? ''));
        if ($title === '') {
            throw ValidationException::withMessages([
                $sch->title() => ['Поле "Название" обязательно для магазина.'],
            ]);
        }

        $cityId = (int) ($data[$sch->cityId()] ?? 0);
        if ($cityId <= 0) {
            throw ValidationException::withMessages([
                $sch->cityId() => ['Поле "Город" обязательно для магазина.'],
            ]);
        }

        if (! array_key_exists($sch->sort(), $data) || trim((string) ($data[$sch->sort()] ?? '')) === '') {
            throw ValidationException::withMessages([
                $sch->sort() => ['Поле «Порядок» (sort) обязательно для магазина.'],
            ]);
        }

        if ((int) ($data[$sch->sort()] ?? 0) < 0) {
            throw ValidationException::withMessages([
                $sch->sort() => ['Поле «Порядок» (sort) не может быть отрицательным.'],
            ]);
        }

        if (! City::query()->whereKey($cityId)->exists()) {
            throw ValidationException::withMessages([
                $sch->cityId() => ['Выбранный город не существует.'],
            ]);
        }

        ShopPayloadAssertions::assertNullableNumeric(
            $data[$sch->latitude()] ?? null,
            $sch->latitude(),
            'Поле "Широта" должно быть числом.',
        );
        ShopPayloadAssertions::assertNullableNumeric(
            $data[$sch->longitude()] ?? null,
            $sch->longitude(),
            'Поле "Долгота" должно быть числом.',
        );
    }
}
