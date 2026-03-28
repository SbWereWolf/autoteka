<?php

declare(strict_types=1);

namespace Tests\Feature;

use Autoteka\SchemaDefinition\Enums\Columns\CacheColumns;
use Autoteka\SchemaDefinition\Enums\Columns\CacheLocksColumns;
use Autoteka\SchemaDefinition\Enums\Columns\CategoryColumns;
use Autoteka\SchemaDefinition\Enums\Columns\CityColumns;
use Autoteka\SchemaDefinition\Enums\Columns\ContactTypeColumns;
use Autoteka\SchemaDefinition\Enums\Columns\FailedJobsColumns;
use Autoteka\SchemaDefinition\Enums\Columns\FeatureColumns;
use Autoteka\SchemaDefinition\Enums\Columns\JobBatchesColumns;
use Autoteka\SchemaDefinition\Enums\Columns\JobsColumns;
use Autoteka\SchemaDefinition\Enums\Columns\MigrationsColumns;
use Autoteka\SchemaDefinition\Enums\Columns\MoonshineUserRolesColumns;
use Autoteka\SchemaDefinition\Enums\Columns\MoonshineUsersColumns;
use Autoteka\SchemaDefinition\Enums\Columns\NotificationsColumns;
use Autoteka\SchemaDefinition\Enums\Columns\PasswordResetTokensColumns;
use Autoteka\SchemaDefinition\Enums\Columns\PromotionColumns;
use Autoteka\SchemaDefinition\Enums\Columns\PromotionGalleryVideoColumns;
use Autoteka\SchemaDefinition\Enums\Columns\PromotionImageColumns;
use Autoteka\SchemaDefinition\Enums\Columns\SessionsColumns;
use Autoteka\SchemaDefinition\Enums\Columns\ShopCategoryColumns;
use Autoteka\SchemaDefinition\Enums\Columns\ShopColumns;
use Autoteka\SchemaDefinition\Enums\Columns\ShopContactColumns;
use Autoteka\SchemaDefinition\Enums\Columns\ShopFeatureColumns;
use Autoteka\SchemaDefinition\Enums\Columns\ShopGalleryImageColumns;
use Autoteka\SchemaDefinition\Enums\Columns\ShopGalleryVideoColumns;
use Autoteka\SchemaDefinition\Enums\Columns\ShopScheduleColumns;
use Autoteka\SchemaDefinition\Enums\Columns\UsersColumns;
use Autoteka\SchemaDefinition\Enums\TableName;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

final class SchemaDefinitionSchemaConsistencyTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, class-string<\BackedEnum>>
     */
    private static function tableToEnumMap(): array
    {
        return [
            TableName::USERS->value => UsersColumns::class,
            TableName::PASSWORD_RESET_TOKENS->value => PasswordResetTokensColumns::class,
            TableName::SESSIONS->value => SessionsColumns::class,
            TableName::CACHE->value => CacheColumns::class,
            TableName::CACHE_LOCKS->value => CacheLocksColumns::class,
            TableName::JOBS->value => JobsColumns::class,
            TableName::JOB_BATCHES->value => JobBatchesColumns::class,
            TableName::FAILED_JOBS->value => FailedJobsColumns::class,
            TableName::MOONSHINE_USER_ROLES->value => MoonshineUserRolesColumns::class,
            TableName::MOONSHINE_USERS->value => MoonshineUsersColumns::class,
            TableName::NOTIFICATIONS->value => NotificationsColumns::class,
            TableName::CITY->value => CityColumns::class,
            TableName::CATEGORY->value => CategoryColumns::class,
            TableName::FEATURE->value => FeatureColumns::class,
            TableName::CONTACT_TYPE->value => ContactTypeColumns::class,
            TableName::PROMOTION->value => PromotionColumns::class,
            'promotion_gallery_image' => PromotionImageColumns::class,
            TableName::PROMOTION_GALLERY_VIDEO->value => PromotionGalleryVideoColumns::class,
            TableName::SHOP->value => ShopColumns::class,
            TableName::SHOP_CATEGORY->value => ShopCategoryColumns::class,
            TableName::SHOP_FEATURE->value => ShopFeatureColumns::class,
            TableName::SHOP_CONTACT->value => ShopContactColumns::class,
            TableName::SHOP_GALLERY_IMAGE->value => ShopGalleryImageColumns::class,
            TableName::SHOP_GALLERY_VIDEO->value => ShopGalleryVideoColumns::class,
            TableName::SHOP_SCHEDULE->value => ShopScheduleColumns::class,
            TableName::MIGRATIONS->value => MigrationsColumns::class,
        ];
    }

    public function test_all_schema_definition_tables_exist_and_have_strict_column_sets(): void
    {
        $tableNames = array_map(
            static fn (TableName $tableName): string => $tableName->value,
            TableName::cases()
        );
        $map = self::tableToEnumMap();

        $mapKeys = array_keys($map);
        sort($tableNames);
        sort($mapKeys);
        self::assertSame(
            $tableNames,
            $mapKeys,
            'TableName enum and table->columns mapping are out of sync.'
        );

        foreach ($map as $table => $columnsEnumClass) {
            self::assertTrue(Schema::hasTable($table), "Expected table [$table] to exist.");

            $expectedColumns = array_map(
                static fn (\BackedEnum $column): string => (string) $column->value,
                $columnsEnumClass::cases()
            );
            $actualColumns = Schema::getColumnListing($table);

            sort($expectedColumns);
            sort($actualColumns);

            $missingColumns = array_values(array_diff($expectedColumns, $actualColumns));
            $unexpectedColumns = array_values(array_diff($actualColumns, $expectedColumns));

            self::assertSame(
                [],
                $missingColumns,
                "Table [$table] misses enum-defined columns: " . implode(', ', $missingColumns)
            );
            self::assertSame(
                [],
                $unexpectedColumns,
                "Table [$table] has columns outside enum: " . implode(', ', $unexpectedColumns)
            );
        }
    }
}
