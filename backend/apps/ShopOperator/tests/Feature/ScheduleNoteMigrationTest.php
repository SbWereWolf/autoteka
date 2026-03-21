<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

final class ScheduleNoteMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_migration_adds_new_columns_and_moves_schedule_note_data(): void
    {
        DB::table('city')->insert([
            'id' => 1,
            'code' => 'city-a',
            'title' => 'City A',
            'sort' => 1,
            'is_published' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('shop')->insert([
            'id' => 10,
            'code' => 'shop-a',
            'title' => 'Shop A',
            'sort' => 1,
            'city_id' => 1,
            'description' => '',
            'site_url' => '',
            'thumb_path' => null,
            'thumb_original_name' => null,
            'is_published' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Schema::table('shop', function (Blueprint $table): void {
            $table->dropColumn([
                'slogan',
                'latitude',
                'longitude',
                'schedule_note',
            ]);
        });

        Schema::create('shop_schedule_note', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('shop_id')->constrained('shop')->cascadeOnDelete();
            $table->text('text');
            $table->unsignedInteger('sort')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
            $table->unique(['shop_id']);
        });

        DB::table('shop_schedule_note')->insert([
            'shop_id' => 10,
            'text' => 'Legacy related note',
            'sort' => 1,
            'is_published' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $migration = require dirname(base_path(), 3) . '/backend/packages/SchemaDefinition/database/migrations/2026_03_21_010000_add_shop_public_fields_and_migrate_schedule_note.php';
        $migration->up();

        self::assertTrue(Schema::hasColumn('shop', 'slogan'));
        self::assertTrue(Schema::hasColumn('shop', 'latitude'));
        self::assertTrue(Schema::hasColumn('shop', 'longitude'));
        self::assertTrue(Schema::hasColumn('shop', 'schedule_note'));
        self::assertFalse(Schema::hasTable('shop_schedule_note'));

        $shop = DB::table('shop')->where('id', 10)->first();

        self::assertNotNull($shop);
        self::assertSame('Shop A', $shop->slogan);
        self::assertSame('Legacy related note', $shop->schedule_note);
        self::assertNull($shop->latitude);
        self::assertNull($shop->longitude);
    }
}
