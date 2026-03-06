<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\Shop\ShopContactUniqueness;
use Illuminate\Console\Command;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use JsonException;
use Throwable;

final class ImportInitialData extends Command
{
    protected $signature = 'autoteka:data:import
        {scope : city|category|feature|shop}
        {--mode=append : dry-run|refresh|append}';

    protected $description = 'Импортирует исходные данные в SQLite из JSON, переданного через STDIN';

    /**
     * @var array<string, int>
     */
    private array $addedCounts = [];

    /**
     * @var array<string, int>
     */
    private array $deletedCounts = [];

    public function handle(): int
    {
        $scope = (string) $this->argument('scope');
        $mode = (string) $this->option('mode');

        if (! in_array($scope, ['city', 'category', 'feature', 'shop'], true)) {
            $this->components->error('Неизвестный scope. Ожидается: city, category, feature, shop.');

            return self::INVALID;
        }

        if (! in_array($mode, ['dry-run', 'refresh', 'append'], true)) {
            $this->components->error('Неизвестный режим. Ожидается: dry-run, refresh, append.');

            return self::INVALID;
        }

        try {
            $rows = $this->readInputRows();
        } catch (Throwable $exception) {
            $this->components->error($exception->getMessage());

            return self::FAILURE;
        }

        $success = false;
        $exception = null;
        $this->addedCounts = [];
        $this->deletedCounts = [];

        DB::beginTransaction();

        try {
            if ($mode === 'refresh') {
                $this->clearScope($scope);
            }

            $this->importScope($scope, $rows);
            $success = true;
        } catch (Throwable $caught) {
            $exception = $caught;
        }

        if (! $success || $mode === 'dry-run') {
            DB::rollBack();
        } else {
            DB::commit();
        }

        $this->renderSummary($scope, $mode, $success);

        if ($exception instanceof Throwable) {
            $this->renderException($exception);

            return self::FAILURE;
        }

        return self::SUCCESS;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function readInputRows(): array
    {
        $payload = stream_get_contents(STDIN);
        if (! is_string($payload)) {
            throw new \InvalidArgumentException('Не удалось прочитать JSON из STDIN.');
        }

        $payload = trim($payload);
        if ($payload === '') {
            throw new \InvalidArgumentException('STDIN пуст. Передайте JSON-массив через стандартный ввод.');
        }

        try {
            $decoded = json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new \InvalidArgumentException('Некорректный JSON: '.$exception->getMessage(), 0, $exception);
        }

        if (! is_array($decoded)) {
            throw new \InvalidArgumentException('Ожидается JSON-массив.');
        }

        return array_values(array_filter(
            $decoded,
            static fn (mixed $row): bool => is_array($row),
        ));
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function importScope(string $scope, array $rows): void
    {
        match ($scope) {
            'city' => $this->importCities($rows),
            'category' => $this->importCategories($rows),
            'feature' => $this->importFeatures($rows),
            'shop' => $this->importShops($rows),
        };
    }

    private function clearScope(string $scope): void
    {
        match ($scope) {
            'city' => $this->deleteRows('city'),
            'category' => $this->deleteRows('category'),
            'feature' => $this->deleteRows('feature'),
            'shop' => $this->clearShopScope(),
        };
    }

    private function clearShopScope(): void
    {
        $this->deleteRows('shop_schedule');
        $this->deleteRows('shop_schedule_note');
        $this->deleteRows('shop_gallery_image');
        $this->deleteRows('shop_contact');
        $this->deleteRows('shop_feature');
        $this->deleteRows('shop_category');
        $this->deleteRows('shop');
        $this->deleteRows('contact_type');
    }

    private function deleteRows(string $table): void
    {
        $deleted = DB::table($table)->delete();
        $this->deletedCounts[$table] = $deleted;

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('DELETE FROM sqlite_sequence WHERE name = ?', [$table]);
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function importCities(array $rows): void
    {
        $payload = array_map(function (array $row): array {
            $code = trim((string) ($row['code'] ?? ''));
            $title = trim((string) ($row['name'] ?? $row['title'] ?? ''));
            if ($code === '' || $title === '') {
                throw new \InvalidArgumentException('Для city обязательны поля code и name/title.');
            }

            return [
                'code' => $code,
                'title' => $title,
                'sort' => (int) ($row['sort'] ?? 0),
                'is_published' => (bool) ($row['is_published'] ?? true),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }, $rows);

        $this->bulkInsert('city', $payload);
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function importCategories(array $rows): void
    {
        $payload = array_map(function (array $row): array {
            $code = trim((string) ($row['code'] ?? ''));
            $title = trim((string) ($row['name'] ?? $row['title'] ?? ''));
            if ($code === '' || $title === '') {
                throw new \InvalidArgumentException('Для category обязательны поля code и name/title.');
            }

            return [
                'code' => $code,
                'title' => $title,
                'sort' => (int) ($row['sort'] ?? 0),
                'is_published' => (bool) ($row['is_published'] ?? true),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }, $rows);

        $this->bulkInsert('category', $payload);
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function importFeatures(array $rows): void
    {
        $payload = array_map(function (array $row): array {
            $code = trim((string) ($row['code'] ?? ''));
            $title = trim((string) ($row['name'] ?? $row['title'] ?? ''));
            if ($code === '' || $title === '') {
                throw new \InvalidArgumentException('Для feature обязательны поля code и name/title.');
            }

            return [
                'code' => $code,
                'title' => $title,
                'sort' => (int) ($row['sort'] ?? 0),
                'is_published' => (bool) ($row['is_published'] ?? true),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }, $rows);

        $this->bulkInsert('feature', $payload);
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function importShops(array $rows): void
    {
        $contactTypeCodes = collect($rows)
            ->flatMap(static fn (array $shop): array => is_iterable($shop['contacts'] ?? null)
                ? array_values(array_filter((array) $shop['contacts'], 'is_array'))
                : [])
            ->map(static fn (array $contact): string => trim((string) ($contact['type'] ?? '')))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $contactTypeRows = [];
        foreach ($contactTypeCodes as $index => $code) {
            $contactTypeRows[] = [
                'code' => $code,
                'title' => $code,
                'sort' => $index * 10,
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        $this->bulkInsert('contact_type', $contactTypeRows);

        $cityIds = DB::table('city')->pluck('id', 'code')->all();
        $categoryIds = DB::table('category')->pluck('id', 'code')->all();
        $featureIds = DB::table('feature')->pluck('id', 'code')->all();
        $contactTypeIds = DB::table('contact_type')->pluck('id', 'code')->all();

        $shopRows = [];
        foreach ($rows as $index => $shop) {
            $cityCode = trim((string) ($shop['cityCode'] ?? ''));
            if (! array_key_exists($cityCode, $cityIds)) {
                throw new \InvalidArgumentException(sprintf('Для shop[%d] не найден cityCode=%s.', $index + 1, $cityCode));
            }

            $shopRows[] = [
                'code' => trim((string) ($shop['code'] ?? '')),
                'title' => trim((string) ($shop['name'] ?? $shop['title'] ?? '')),
                'sort' => $index * 10,
                'city_id' => $cityIds[$cityCode],
                'description' => trim((string) ($shop['description'] ?? '')),
                'site_url' => trim((string) ($shop['siteUrl'] ?? '')),
                'thumb_path' => $this->normalizeMediaPath($shop['thumbUrl'] ?? null),
                'is_published' => (bool) ($shop['is_published'] ?? true),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        foreach ($shopRows as $index => $shopRow) {
            if ($shopRow['code'] === '' || $shopRow['title'] === '') {
                throw new \InvalidArgumentException(sprintf('Для shop[%d] обязательны code и name/title.', $index + 1));
            }
        }

        $this->bulkInsert('shop', $shopRows);
        $shopIds = DB::table('shop')->pluck('id', 'code')->all();

        $shopCategoryRows = [];
        $shopFeatureRows = [];
        $shopContactRows = [];
        $shopGalleryRows = [];
        $shopScheduleNoteRows = [];

        foreach ($rows as $shopIndex => $shop) {
            $shopCode = trim((string) ($shop['code'] ?? ''));
            $shopId = $shopIds[$shopCode] ?? null;
            if (! is_int($shopId)) {
                throw new \InvalidArgumentException(sprintf('Для shop[%d] не найден созданный магазин code=%s.', $shopIndex + 1, $shopCode));
            }

            foreach ((is_iterable($shop['categoryCodes'] ?? null) ? $shop['categoryCodes'] : []) as $categoryCode) {
                $categoryCode = trim((string) $categoryCode);
                if (! array_key_exists($categoryCode, $categoryIds)) {
                    throw new \InvalidArgumentException(sprintf('Для shop[%d] не найдена category=%s.', $shopIndex + 1, $categoryCode));
                }

                $shopCategoryRows[] = [
                    'shop_id' => $shopId,
                    'category_id' => $categoryIds[$categoryCode],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            foreach ((is_iterable($shop['featureCodes'] ?? null) ? $shop['featureCodes'] : []) as $featureCode) {
                $featureCode = trim((string) $featureCode);
                if (! array_key_exists($featureCode, $featureIds)) {
                    throw new \InvalidArgumentException(sprintf('Для shop[%d] не найдена feature=%s.', $shopIndex + 1, $featureCode));
                }

                $shopFeatureRows[] = [
                    'shop_id' => $shopId,
                    'feature_id' => $featureIds[$featureCode],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            $preparedContacts = collect(
                is_iterable($shop['contacts'] ?? null)
                    ? array_values(array_filter((array) $shop['contacts'], 'is_array'))
                    : []
            )
                ->map(static function (array $contact, int $contactIndex): array {
                    return [
                        'contact_type_code' => trim((string) ($contact['type'] ?? '')),
                        'value' => ShopContactUniqueness::normalizeValue($contact['value'] ?? ''),
                        'sort' => $contactIndex * 10,
                        'is_published' => (bool) ($contact['is_published'] ?? true),
                    ];
                })
                ->filter(static fn (array $contact): bool => $contact['contact_type_code'] !== '' && $contact['value'] !== '')
                ->values();

            ShopContactUniqueness::assertUnique($preparedContacts->all(), 'contacts');

            foreach ($preparedContacts as $contact) {
                $typeCode = $contact['contact_type_code'];
                if (! array_key_exists($typeCode, $contactTypeIds)) {
                    throw new \InvalidArgumentException(sprintf('Для shop[%d] не найден contact_type=%s.', $shopIndex + 1, $typeCode));
                }

                $shopContactRows[] = [
                    'shop_id' => $shopId,
                    'contact_type_id' => $contactTypeIds[$typeCode],
                    'value' => $contact['value'],
                    'sort' => $contact['sort'],
                    'is_published' => $contact['is_published'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            foreach ((is_iterable($shop['galleryImages'] ?? null) ? $shop['galleryImages'] : []) as $imageIndex => $image) {
                $filePath = $this->normalizeMediaPath($image);
                if ($filePath === null) {
                    continue;
                }

                $shopGalleryRows[] = [
                    'shop_id' => $shopId,
                    'file_path' => $filePath,
                    'sort' => $imageIndex * 10,
                    'is_published' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            $workHours = trim((string) ($shop['workHours'] ?? ''));
            if ($workHours !== '') {
                $shopScheduleNoteRows[] = [
                    'shop_id' => $shopId,
                    'text' => $workHours,
                    'sort' => $shopIndex * 10,
                    'is_published' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        $this->bulkInsert('shop_category', $shopCategoryRows);
        $this->bulkInsert('shop_feature', $shopFeatureRows);
        $this->bulkInsert('shop_contact', $shopContactRows);
        $this->bulkInsert('shop_gallery_image', $shopGalleryRows);
        $this->bulkInsert('shop_schedule_note', $shopScheduleNoteRows);
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function bulkInsert(string $table, array $rows): void
    {
        if ($rows === []) {
            $this->addedCounts[$table] = $this->addedCounts[$table] ?? 0;

            return;
        }

        DB::table($table)->insert($rows);
        $this->addedCounts[$table] = ($this->addedCounts[$table] ?? 0) + count($rows);
    }

    private function normalizeMediaPath(mixed $value): ?string
    {
        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        return ltrim($value, '/');
    }

    private function renderSummary(string $scope, string $mode, bool $success): void
    {
        $this->line(sprintf('Scope: %s', $scope));
        $this->line(sprintf('Режим: %s', $mode));
        $this->line(sprintf('Статус: %s', $success ? 'успех' : 'ошибка'));

        $this->line('Добавленные записи:');
        foreach ($this->formatCounts($this->addedCounts) as $line) {
            $this->line('  '.$line);
        }

        $totalAdded = array_sum($this->addedCounts);
        $this->line(sprintf('Итого добавлено: %d', $totalAdded));

        if ($this->deletedCounts !== []) {
            $this->line('Удалённые записи:');
            foreach ($this->formatCounts($this->deletedCounts) as $line) {
                $this->line('  '.$line);
            }
        }

        if ($success && $mode === 'dry-run') {
            $this->comment('Dry-run завершён успешно: данные были тестовыми и не сохранены в БД.');
        }
    }

    /**
     * @param  array<string, int>  $counts
     * @return list<string>
     */
    private function formatCounts(array $counts): array
    {
        if ($counts === []) {
            return ['нет изменений'];
        }

        return collect($counts)
            ->sortKeys()
            ->map(static fn (int $count, string $table): string => sprintf('%s: %d', $table, $count))
            ->values()
            ->all();
    }

    private function renderException(Throwable $exception): void
    {
        if ($exception instanceof ValidationException) {
            foreach ($exception->errors() as $field => $messages) {
                foreach (Arr::wrap($messages) as $message) {
                    $this->components->error(sprintf('%s: %s', $field, $message));
                }
            }

            return;
        }

        $this->components->error($exception->getMessage());
    }
}
