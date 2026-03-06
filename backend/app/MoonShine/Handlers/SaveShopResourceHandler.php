<?php

declare(strict_types=1);

namespace App\MoonShine\Handlers;

use App\Models\Shop;
use App\Models\ShopContact;
use App\Models\ShopGalleryImage;
use App\Models\ShopSchedule;
use App\Models\ShopScheduleNote;
use App\Support\Shop\ShopContactUniqueness;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

final class SaveShopResourceHandler
{
    public function __invoke(Shop $shop, array $data): Shop
    {
        return DB::transaction(function () use ($shop, $data): Shop {
            $shop->fill([
                'code' => $data['code'] ?? '',
                'title' => $data['title'] ?? '',
                'sort' => (int) ($data['sort'] ?? 0),
                'city_id' => (int) ($data['city_id'] ?? 0),
                'description' => (string) ($data['description'] ?? ''),
                'site_url' => (string) ($data['site_url'] ?? ''),
                'thumb_path' => $this->nullableString($data['thumb_path'] ?? null),
                'is_published' => (bool) ($data['is_published'] ?? false),
            ]);

            $originalThumb = $shop->getOriginal('thumb_path');
            $shop->save();

            if ($originalThumb && $originalThumb !== $shop->thumb_path) {
                Storage::disk(config('autoteka.media.disk'))->delete($originalThumb);
            }

            $this->syncCategoryLinks($shop, $data['category_links'] ?? []);
            $this->syncFeatureLinks($shop, $data['feature_links'] ?? []);
            $this->syncContacts($shop, $data['contact_entries'] ?? []);
            $this->syncGallery($shop, $data['gallery_entries'] ?? []);
            $this->syncSchedules($shop, $data['schedule_entries'] ?? []);
            $this->syncScheduleNote($shop, $data['schedule_note_text'] ?? '');

            return $shop->fresh([
                'city',
                'categories',
                'features',
                'contacts.contactType',
                'galleryImages',
                'schedules',
                'scheduleNotes',
            ]) ?? $shop;
        });
    }

    private function syncCategoryLinks(Shop $shop, mixed $rows): void
    {
        $ids = collect(is_iterable($rows) ? $rows : [])
            ->pluck('category_id')
            ->filter()
            ->map(static fn (mixed $id): int => (int) $id)
            ->unique()
            ->values()
            ->all();

        $shop->categories()->sync($ids);
    }

    private function syncFeatureLinks(Shop $shop, mixed $rows): void
    {
        $ids = collect(is_iterable($rows) ? $rows : [])
            ->pluck('feature_id')
            ->filter()
            ->map(static fn (mixed $id): int => (int) $id)
            ->unique()
            ->values()
            ->all();

        $shop->features()->sync($ids);
    }

    private function syncContacts(Shop $shop, mixed $rows): void
    {
        $desired = collect(is_iterable($rows) ? $rows : [])
            ->map(static function (mixed $row): ?array {
                if (! is_array($row)) {
                    return null;
                }

                $typeId = (int) ($row['contact_type_id'] ?? 0);
                $value = ShopContactUniqueness::normalizeValue($row['value'] ?? '');
                if ($typeId === 0 || $value === '') {
                    return null;
                }

                return [
                    'id' => isset($row['id']) ? (int) $row['id'] : null,
                    'contact_type_id' => $typeId,
                    'value' => $value,
                    'sort' => (int) ($row['sort'] ?? 0),
                    'is_published' => (bool) ($row['is_published'] ?? true),
                ];
            })
            ->filter()
            ->values();

        ShopContactUniqueness::assertUnique($desired->all());

        $existing = $shop->contacts()->get()->keyBy('id');
        $keptIds = [];

        foreach ($desired as $item) {
            $contact = $item['id'] ? $existing->get($item['id']) : null;
            if (! $contact instanceof ShopContact) {
                $contact = new ShopContact;
                $contact->shop_id = $shop->getKey();
            }

            $contact->fill([
                'contact_type_id' => $item['contact_type_id'],
                'value' => $item['value'],
                'sort' => $item['sort'],
                'is_published' => $item['is_published'],
            ]);
            $contact->save();
            $keptIds[] = $contact->getKey();
        }

        if ($keptIds === []) {
            $shop->contacts()->delete();

            return;
        }

        $shop->contacts()->whereNotIn('id', $keptIds)->delete();
    }

    private function syncGallery(Shop $shop, mixed $rows): void
    {
        $desired = collect(is_iterable($rows) ? $rows : [])
            ->map(static function (mixed $row): ?array {
                if (! is_array($row)) {
                    return null;
                }

                $filePath = trim((string) ($row['file_path'] ?? ''));
                if ($filePath === '') {
                    return null;
                }

                return [
                    'id' => isset($row['id']) ? (int) $row['id'] : null,
                    'file_path' => $filePath,
                    'sort' => (int) ($row['sort'] ?? 0),
                    'is_published' => (bool) ($row['is_published'] ?? true),
                ];
            })
            ->filter()
            ->values();

        $existing = $shop->galleryImages()->get()->keyBy('id');
        $keptIds = [];
        $disk = Storage::disk(config('autoteka.media.disk'));

        foreach ($desired as $item) {
            $image = $item['id'] ? $existing->get($item['id']) : null;
            $oldPath = $image?->file_path;
            if (! $image instanceof ShopGalleryImage) {
                $image = new ShopGalleryImage;
                $image->shop_id = $shop->getKey();
            }

            $image->fill([
                'file_path' => $item['file_path'],
                'sort' => $item['sort'],
                'is_published' => $item['is_published'],
            ]);
            $image->save();

            if ($oldPath && $oldPath !== $image->file_path) {
                $disk->delete($oldPath);
            }

            $keptIds[] = $image->getKey();
        }

        $toDelete = $shop->galleryImages()
            ->when($keptIds !== [], static fn ($query) => $query->whereNotIn('id', $keptIds))
            ->get();

        foreach ($toDelete as $image) {
            $disk->delete($image->file_path);
            $image->delete();
        }
    }

    private function syncSchedules(Shop $shop, mixed $rows): void
    {
        $desiredByWeekday = collect(is_iterable($rows) ? $rows : [])
            ->map(static function (mixed $row): ?array {
                if (! is_array($row)) {
                    return null;
                }

                $weekday = (int) ($row['weekday'] ?? 0);
                $timeFrom = trim((string) ($row['time_from'] ?? ''));
                $timeTo = trim((string) ($row['time_to'] ?? ''));
                if ($weekday < 1 || $weekday > 7 || $timeFrom === '' || $timeTo === '') {
                    return null;
                }

                return [
                    'id' => isset($row['id']) ? (int) $row['id'] : null,
                    'weekday' => $weekday,
                    'time_from' => $timeFrom,
                    'time_to' => $timeTo,
                    'sort' => (int) ($row['sort'] ?? 0),
                    'is_published' => (bool) ($row['is_published'] ?? true),
                ];
            })
            ->filter()
            ->keyBy('weekday');

        $existing = $shop->schedules()->get()->keyBy('weekday');
        $keptIds = [];

        foreach ($desiredByWeekday as $weekday => $item) {
            $schedule = $existing->get($weekday);
            if (! $schedule instanceof ShopSchedule && $item['id']) {
                $schedule = ShopSchedule::query()
                    ->where('shop_id', $shop->getKey())
                    ->find($item['id']);
            }

            if (! $schedule instanceof ShopSchedule) {
                $schedule = new ShopSchedule;
                $schedule->shop_id = $shop->getKey();
            }

            $schedule->fill([
                'weekday' => $item['weekday'],
                'time_from' => $item['time_from'],
                'time_to' => $item['time_to'],
                'sort' => $item['sort'],
                'is_published' => $item['is_published'],
            ]);
            $schedule->save();
            $keptIds[] = $schedule->getKey();
        }

        if ($keptIds === []) {
            $shop->schedules()->delete();

            return;
        }

        $shop->schedules()->whereNotIn('id', $keptIds)->delete();
    }

    private function syncScheduleNote(Shop $shop, mixed $value): void
    {
        $text = trim((string) $value);
        $shop->scheduleNotes()->delete();

        if ($text === '') {
            return;
        }

        $note = new ShopScheduleNote;
        $note->shop_id = $shop->getKey();
        $note->text = $text;
        $note->sort = 0;
        $note->is_published = true;
        $note->save();
    }

    private function nullableString(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
