<?php

declare(strict_types=1);

namespace Tests\Feature\Console;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use ShopOperator\Models\City;
use ShopOperator\Models\Shop;
use Tests\TestCase;

final class DemoPromotionCommandsTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_promotion_commands_are_registered(): void
    {
        $commands = Artisan::all();

        self::assertArrayHasKey('demo:promo:create', $commands);
        self::assertArrayHasKey('demo:promo:purge', $commands);
    }

    public function test_create_command_refuses_to_run_when_promotions_exist(): void
    {
        $commands = Artisan::all();
        self::assertArrayHasKey('demo:promo:create', $commands);

        $shop = $this->createShop('existing-promo-shop', 'Existing Promo Shop');

        DB::table('promotion')->insert([
            'shop_id' => $shop->getKey(),
            'code' => 'existing-promo',
            'title' => 'Existing promo',
            'description' => 'Already here',
            'start_date' => '2026-03-20',
            'end_date' => '2026-03-21',
            'is_published' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $exitCode = Artisan::call('demo:promo:create');

        self::assertSame(1, $exitCode);
        self::assertStringContainsString('demo:promo:purge', Artisan::output());
    }

    public function test_create_command_generates_promotions_for_shuffled_shops_and_stores_gallery_files(): void
    {
        $commands = Artisan::all();
        self::assertArrayHasKey('demo:promo:create', $commands);

        Storage::fake((string) config('autoteka.media.disk', 'public'));
        $disk = Storage::disk((string) config('autoteka.media.disk', 'public'));

        $disk->put('shops/gallery/source-a.webp', 'a');
        $disk->put('shops/gallery/source-b.webp', 'b');
        $disk->put('shops/gallery/source-c.png', 'c');

        foreach (range(1, 8) as $index) {
            $this->createShop("demo-shop-{$index}", "Demo Shop {$index}");
        }

        $exitCode = Artisan::call('demo:promo:create');

        self::assertSame(0, $exitCode);

        $countsByShop = DB::table('promotion')
            ->select('shop_id', DB::raw('COUNT(*) as promotion_count'))
            ->groupBy('shop_id')
            ->pluck('promotion_count', 'shop_id');

        $zeroPromoShops = Shop::query()
            ->pluck('id')
            ->filter(static fn (int $shopId): bool => ! $countsByShop->has($shopId))
            ->count();

        self::assertSame(2, $zeroPromoShops);
        self::assertGreaterThanOrEqual(6, (int) DB::table('promotion')->count());
        self::assertLessThanOrEqual(30, (int) DB::table('promotion')->count());

        foreach ($countsByShop as $shopId => $promotionCount) {
            self::assertGreaterThanOrEqual(1, (int) $promotionCount, "shop {$shopId} must have at least one promo");
            self::assertLessThanOrEqual(5, (int) $promotionCount, "shop {$shopId} must have at most five promos");
        }

        $galleryRows = DB::table('promotion_gallery_image')->get();

        foreach ($galleryRows as $row) {
            self::assertStringStartsWith('promotion/gallery/', (string) $row->file_path);
            self::assertFalse(
                str_starts_with((string) $row->file_path, 'shops/gallery/'),
                'promotion gallery path must not point to the shop gallery source directory',
            );
        }
    }

    public function test_purge_command_removes_promotions_and_gallery_files(): void
    {
        $commands = Artisan::all();
        self::assertArrayHasKey('demo:promo:purge', $commands);

        Storage::fake((string) config('autoteka.media.disk', 'public'));
        $disk = Storage::disk((string) config('autoteka.media.disk', 'public'));

        $shop = $this->createShop('purge-demo-shop', 'Purge Demo Shop');

        $promotionId = DB::table('promotion')->insertGetId([
            'shop_id' => $shop->getKey(),
            'code' => 'purge-demo-promo',
            'title' => 'Purge Demo Promo',
            'description' => 'To purge',
            'start_date' => '2026-03-20',
            'end_date' => '2026-03-31',
            'is_published' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $disk->put('promotion/gallery/purge-demo.webp', 'purge');

        DB::table('promotion_gallery_image')->insert([
            'promotion_id' => $promotionId,
            'file_path' => 'promotion/gallery/purge-demo.webp',
            'original_name' => 'purge-demo.webp',
            'sort' => 1,
            'is_published' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $exitCode = Artisan::call('demo:promo:purge');

        self::assertSame(0, $exitCode);
        self::assertSame(0, DB::table('promotion')->count());
        self::assertSame(0, DB::table('promotion_gallery_image')->count());
        $disk->assertMissing('promotion/gallery/purge-demo.webp');
    }

    private function createShop(string $code, string $title): Shop
    {
        $city = City::query()->create([
            'code' => $code . '-city',
            'title' => $title . ' City',
            'sort' => 1,
            'is_published' => true,
        ]);

        return Shop::query()->create([
            'code' => $code,
            'title' => $title,
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => '',
            'site_url' => '',
            'slogan' => null,
            'latitude' => null,
            'longitude' => null,
            'schedule_note' => null,
            'thumb_path' => null,
            'is_published' => true,
        ]);
    }
}
