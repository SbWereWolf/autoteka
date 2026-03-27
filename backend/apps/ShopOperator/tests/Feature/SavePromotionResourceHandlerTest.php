<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use ShopOperator\Models\Promotion;
use ShopOperator\Models\City;
use ShopOperator\Models\Shop;
use ShopOperator\MoonShine\Handlers\SavePromotionResourceHandler;
use Tests\TestCase;

final class SavePromotionResourceHandlerTest extends TestCase
{
    use RefreshDatabase;

    public function test_save_handler_generates_shop_scoped_code_and_recalculates_on_rename(): void
    {
        $shop = $this->createShop('promo-code-shop', 'Promo Code Shop');
        $handler = app(SavePromotionResourceHandler::class);

        $result = $handler($this->newPromotionModel(), [
            'shop_id' => $shop->getKey(),
            'code' => 'manual-code-that-must-be-ignored',
            'title' => 'Winter Sale',
            'description' => 'Winter sale description',
            'start_date' => '2026-03-20',
            'end_date' => '2026-03-31',
            'is_published' => true,
            'gallery_entries' => [],
        ]);

        self::assertSame('promo-code-shop-winter-sale', $result->code);
        $this->assertDatabaseHas('promotion', [
            'id' => $result->getKey(),
            'shop_id' => $shop->getKey(),
            'code' => 'promo-code-shop-winter-sale',
            'title' => 'Winter Sale',
            'description' => 'Winter sale description',
            'start_date' => '2026-03-20',
            'end_date' => '2026-03-31',
            'is_published' => 1,
        ]);

        $updated = $handler($result, [
            'shop_id' => $shop->getKey(),
            'code' => 'manual-code-that-must-be-ignored-again',
            'title' => 'Spring Sale',
            'description' => 'Spring sale description',
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-15',
            'is_published' => false,
            'gallery_entries' => [],
        ]);

        self::assertSame('promo-code-shop-spring-sale', $updated->code);
        $this->assertDatabaseHas('promotion', [
            'id' => $result->getKey(),
            'shop_id' => $shop->getKey(),
            'code' => 'promo-code-shop-spring-sale',
            'title' => 'Spring Sale',
            'description' => 'Spring sale description',
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-15',
            'is_published' => 0,
        ]);
    }

    public function test_save_handler_persists_gallery_original_names_and_removes_replaced_files(): void
    {
        Storage::fake((string) config('autoteka.media.disk', 'public'));
        $disk = Storage::disk((string) config('autoteka.media.disk', 'public'));

        $shop = $this->createShop('promo-gallery-shop', 'Promo Gallery Shop');
        $handler = app(SavePromotionResourceHandler::class);

        $oldPath = 'promotion/gallery/old.webp';
        $replacedPath = 'promotion/gallery/replaced.webp';
        $replacementPath = 'promotion/gallery/new.webp';
        $disk->put($oldPath, 'old');
        $disk->put($replacedPath, 'replaced');
        $disk->put($replacementPath, 'new');

        $promotion = $handler($this->newPromotionModel(), [
            'shop_id' => $shop->getKey(),
            'code' => '',
            'title' => 'Gallery Sale',
            'description' => 'Gallery sale description',
            'start_date' => '2026-03-20',
            'end_date' => '2026-03-31',
            'is_published' => true,
            'gallery_entries' => [
                [
                    'file_path' => $oldPath,
                    'original_name' => 'old-original.webp',
                    'sort' => 1,
                    'is_published' => true,
                ],
                [
                    'file_path' => $replacedPath,
                    'original_name' => 'replaced-original.webp',
                    'sort' => 2,
                    'is_published' => true,
                ],
            ],
        ]);

        $this->assertDatabaseHas('promotion_gallery_image', [
            'promotion_id' => $promotion->getKey(),
            'file_path' => $oldPath,
            'original_name' => 'old-original.webp',
            'sort' => 1,
            'is_published' => 1,
        ]);
        $this->assertDatabaseHas('promotion_gallery_image', [
            'promotion_id' => $promotion->getKey(),
            'file_path' => $replacedPath,
            'original_name' => 'replaced-original.webp',
            'sort' => 2,
            'is_published' => 1,
        ]);

        $updated = $handler($promotion, [
            'shop_id' => $shop->getKey(),
            'code' => '',
            'title' => 'Gallery Sale',
            'description' => 'Gallery sale description',
            'start_date' => '2026-03-20',
            'end_date' => '2026-03-31',
            'is_published' => true,
            'gallery_entries' => [
                [
                    'id' => $this->promotionImageIdByPath($promotion->getKey(), $replacementPath),
                    'file_path' => $replacementPath,
                    'original_name' => 'replacement-original.webp',
                    'sort' => 1,
                    'is_published' => true,
                ],
            ],
        ]);

        self::assertSame($promotion->getKey(), $updated->getKey());
        $this->assertDatabaseHas('promotion_gallery_image', [
            'promotion_id' => $promotion->getKey(),
            'file_path' => $replacementPath,
            'original_name' => 'replacement-original.webp',
            'sort' => 1,
            'is_published' => 1,
        ]);
        $this->assertDatabaseMissing('promotion_gallery_image', [
            'promotion_id' => $promotion->getKey(),
            'file_path' => $oldPath,
        ]);
        $disk->assertMissing($oldPath);
    }

    public function test_save_handler_allows_text_only_promotions_without_gallery_rows(): void
    {
        $shop = $this->createShop('promo-text-shop', 'Promo Text Shop');
        $handler = app(SavePromotionResourceHandler::class);

        $promotion = $handler($this->newPromotionModel(), [
            'shop_id' => $shop->getKey(),
            'code' => '',
            'title' => 'Text Only Sale',
            'description' => 'Text only promotion',
            'start_date' => '2026-03-20',
            'end_date' => '2026-03-31',
            'is_published' => true,
            'gallery_entries' => [],
        ]);

        self::assertSame(0, DB::table('promotion_gallery_image')->where('promotion_id', $promotion->getKey())->count());
    }

    public function test_save_handler_uses_next_max_numeric_suffix_for_code_collision(): void
    {
        $shop = $this->createShop('promo-suffix-shop', 'Promo Suffix Shop');
        $handler = app(SavePromotionResourceHandler::class);

        DB::table('promotion')->insert([
            [
                'shop_id' => $shop->getKey(),
                'code' => 'promo-suffix-shop-summer-sale',
                'title' => 'Summer Sale',
                'description' => 'Base code',
                'start_date' => '2026-05-01',
                'end_date' => '2026-05-01',
                'is_published' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'shop_id' => $shop->getKey(),
                'code' => 'promo-suffix-shop-summer-sale-5',
                'title' => 'Summer Sale 5',
                'description' => 'Suffix 5',
                'start_date' => '2026-05-01',
                'end_date' => '2026-05-01',
                'is_published' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'shop_id' => $shop->getKey(),
                'code' => 'promo-suffix-shop-summer-sale-draft',
                'title' => 'Summer Sale Draft',
                'description' => 'Non numeric suffix',
                'start_date' => '2026-05-01',
                'end_date' => '2026-05-01',
                'is_published' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $promotion = $handler($this->newPromotionModel(), [
            'shop_id' => $shop->getKey(),
            'title' => 'Summer Sale',
            'description' => 'Generated suffix promotion',
            'start_date' => '2026-05-08',
            'end_date' => '2026-05-08',
            'is_published' => false,
            'gallery_entries' => [],
        ]);

        self::assertSame('promo-suffix-shop-summer-sale-6', $promotion->code);
    }

    private function createShop(string $code, string $title): Shop
    {
        $city = City::query()->create([
            'code' => $code.'-city',
            'title' => $title.' City',
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

    private function newPromotionModel(): object
    {
        return new Promotion();
    }

    private function promotionImageIdByPath(int $promotionId, string $path): int
    {
        $row = DB::table('promotion_gallery_image')
            ->where('promotion_id', $promotionId)
            ->where('file_path', $path)
            ->first();

        return (int) ($row->id ?? 0);
    }
}
