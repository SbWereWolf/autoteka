<?php

declare(strict_types=1);

namespace Tests\Feature\Console;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use ShopOperator\Models\City;
use ShopOperator\Models\Shop;
use Tests\TestCase;

final class DemoPromotionCommandTest extends TestCase
{
    public function test_demo_promo_commands_are_registered(): void
    {
        $commands = Artisan::all();

        self::assertArrayHasKey('demo:promo:create', $commands);
        self::assertArrayHasKey('demo:promo:purge', $commands);
    }

    public function test_demo_promo_create_fails_when_promotions_exist(): void
    {
        Artisan::call('migrate:fresh', ['--force' => true]);

        $shop = $this->createShop('existing-shop', 'Existing Shop');

        DB::table('promotion')->insert([
            'shop_id' => $shop->getKey(),
            'code' => 'existing-shop-existing-promo',
            'title' => 'Existing promo',
            'description' => 'Existing promo description',
            'start_date' => '2026-03-27',
            'end_date' => '2026-03-28',
            'is_published' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $exitCode = Artisan::call('demo:promo:create');

        self::assertSame(1, $exitCode);
        self::assertStringContainsString('demo:promo:purge', Artisan::output());
    }

    public function test_demo_promo_create_generates_promotions_and_gallery_files(): void
    {
        Artisan::call('migrate:fresh', ['--force' => true]);
        Storage::fake((string) config('autoteka.media.disk', 'public'));

        $disk = Storage::disk((string) config('autoteka.media.disk', 'public'));
        $disk->put('shops/gallery/source-a.jpg', 'source-a');
        $disk->put('shops/gallery/source-b.png', 'source-b');

        $shops = [
            $this->createShop('demo-shop-1', 'Demo Shop 1'),
            $this->createShop('demo-shop-2', 'Demo Shop 2'),
            $this->createShop('demo-shop-3', 'Demo Shop 3'),
            $this->createShop('demo-shop-4', 'Demo Shop 4'),
        ];

        $exitCode = Artisan::call('demo:promo:create');

        self::assertSame(0, $exitCode);

        $promotionCount = DB::table('promotion')->count();
        self::assertGreaterThanOrEqual(3, $promotionCount);
        self::assertLessThanOrEqual(15, $promotionCount);

        $promotionShopIds = DB::table('promotion')
            ->pluck('shop_id')
            ->map(static fn (mixed $value): int => (int) $value)
            ->all();

        self::assertContainsOnly('int', $promotionShopIds);
        self::assertNotSame([], $promotionShopIds);
        $allowedShopIds = array_map(static fn (Shop $shop): int => $shop->getKey(), $shops);

        foreach ($promotionShopIds as $shopId) {
            self::assertContains($shopId, $allowedShopIds);
        }

        $galleryPaths = DB::table('promotion_gallery_image')
            ->pluck('file_path')
            ->map(static fn (mixed $value): string => (string) $value)
            ->all();

        foreach ($galleryPaths as $path) {
            self::assertStringStartsWith('promotion/gallery/', $path);
            $disk->assertExists($path);
        }
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
