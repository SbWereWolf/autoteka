<?php

declare(strict_types=1);

namespace Tests\Feature;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use ShopAPI\Models\City;
use ShopAPI\Models\Shop;
use Tests\TestCase;

final class PromotionEndpointTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        CarbonImmutable::setTestNow(
            CarbonImmutable::create(2026, 3, 26, 12, 0, 0, 'UTC'),
        );
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    public function test_promotion_endpoint_returns_empty_array_when_shop_has_no_promotions(): void
    {
        $shop = $this->createPublishedShop('shop-empty');

        $this->getJson("/api/v1/shop/{$shop->code}/promotion")
            ->assertOk()
            ->assertExactJson([]);
    }

    public function test_promotion_endpoint_filters_unpublished_future_and_expired_promotions(): void
    {
        $shop = $this->createPublishedShop('shop-filtered');
        $this->insertPromotion($shop->getKey(), [
            'code' => 'shop-filtered-active',
            'title' => 'Active promotion',
            'description' => 'Visible promo',
            'start_date' => '2026-03-25',
            'end_date' => '2026-03-27',
            'is_published' => true,
        ]);
        $this->insertPromotion($shop->getKey(), [
            'code' => 'shop-filtered-hidden',
            'title' => 'Hidden promotion',
            'description' => 'Hidden promo',
            'start_date' => '2026-03-25',
            'end_date' => '2026-03-27',
            'is_published' => false,
        ]);
        $this->insertPromotion($shop->getKey(), [
            'code' => 'shop-filtered-future',
            'title' => 'Future promotion',
            'description' => 'Future promo',
            'start_date' => '2026-03-27',
            'end_date' => '2026-03-28',
            'is_published' => true,
        ]);
        $this->insertPromotion($shop->getKey(), [
            'code' => 'shop-filtered-expired',
            'title' => 'Expired promotion',
            'description' => 'Expired promo',
            'start_date' => '2026-03-24',
            'end_date' => '2026-03-25',
            'is_published' => true,
        ]);

        $this->getJson("/api/v1/shop/{$shop->code}/promotion")
            ->assertOk()
            ->assertExactJson([
                [
                    'id' => 1,
                    'code' => 'shop-filtered-active',
                    'title' => 'Active promotion',
                    'description' => 'Visible promo',
                    'startDate' => '2026-03-25',
                    'endDate' => '2026-03-27',
                    'galleryItems' => [],
                ],
            ]);
    }

    public function test_promotion_endpoint_sorts_promotions_and_images_and_omits_unpublished_images(): void
    {
        Storage::fake((string) config('autoteka.media.disk', 'public'));
        $shop = $this->createPublishedShop('shop-sorted');

        $firstPromotionId = $this->insertPromotion($shop->getKey(), [
            'code' => 'shop-sorted-early',
            'title' => 'Early promotion',
            'description' => 'Earlier promo',
            'start_date' => '2026-03-25',
            'end_date' => '2026-03-27',
            'is_published' => true,
        ]);
        $secondPromotionId = $this->insertPromotion($shop->getKey(), [
            'code' => 'shop-sorted-late',
            'title' => 'Late promotion',
            'description' => 'Later promo',
            'start_date' => '2026-03-26',
            'end_date' => '2026-03-28',
            'is_published' => true,
        ]);

        $firstEarlyImageId = $this->insertPromotionImage($firstPromotionId, [
            'file_path' => 'promotions/early/b.webp',
            'original_name' => 'b-original.webp',
            'sort' => 2,
            'is_published' => true,
        ]);
        $secondEarlyImageId = $this->insertPromotionImage($firstPromotionId, [
            'file_path' => 'promotions/early/a.webp',
            'original_name' => 'a-original.webp',
            'sort' => 1,
            'is_published' => true,
        ]);
        $this->insertPromotionImage($firstPromotionId, [
            'file_path' => 'promotions/early/hidden.webp',
            'original_name' => 'hidden-original.webp',
            'sort' => 0,
            'is_published' => false,
        ]);

        $firstLateImageId = $this->insertPromotionImage($secondPromotionId, [
            'file_path' => 'promotions/late/c.webp',
            'original_name' => 'c-original.webp',
            'sort' => 1,
            'is_published' => true,
        ]);
        $secondLateImageId = $this->insertPromotionImage($secondPromotionId, [
            'file_path' => 'promotions/late/d.webp',
            'original_name' => 'd-original.webp',
            'sort' => 1,
            'is_published' => true,
        ]);

        $this->getJson("/api/v1/shop/{$shop->code}/promotion")
            ->assertOk()
            ->assertExactJson([
                [
                    'id' => $firstPromotionId,
                    'code' => 'shop-sorted-early',
                    'title' => 'Early promotion',
                    'description' => 'Earlier promo',
                    'startDate' => '2026-03-25',
                    'endDate' => '2026-03-27',
                    'galleryItems' => [
                        [
                            'id' => $secondEarlyImageId,
                            'type' => 'image',
                            'src' => Storage::disk((string) config('autoteka.media.disk', 'public'))->url('promotions/early/a.webp'),
                            'sort' => 1,
                        ],
                        [
                            'id' => $firstEarlyImageId,
                            'type' => 'image',
                            'src' => Storage::disk((string) config('autoteka.media.disk', 'public'))->url('promotions/early/b.webp'),
                            'sort' => 2,
                        ],
                    ],
                ],
                [
                    'id' => $secondPromotionId,
                    'code' => 'shop-sorted-late',
                    'title' => 'Late promotion',
                    'description' => 'Later promo',
                    'startDate' => '2026-03-26',
                    'endDate' => '2026-03-28',
                    'galleryItems' => [
                        [
                            'id' => $firstLateImageId,
                            'type' => 'image',
                            'src' => Storage::disk((string) config('autoteka.media.disk', 'public'))->url('promotions/late/c.webp'),
                            'sort' => 1,
                        ],
                        [
                            'id' => $secondLateImageId,
                            'type' => 'image',
                            'src' => Storage::disk((string) config('autoteka.media.disk', 'public'))->url('promotions/late/d.webp'),
                            'sort' => 1,
                        ],
                    ],
                ],
            ]);
    }

    public function test_promotion_endpoint_returns_mixed_gallery_items_in_stable_sort_order(): void
    {
        Storage::fake((string) config('autoteka.media.disk', 'public'));
        $shop = $this->createPublishedShop('shop-mixed-promotion');

        $promotionId = $this->insertPromotion($shop->getKey(), [
            'code' => 'shop-mixed-promotion-video',
            'title' => 'Mixed promotion',
            'description' => 'Mixed promo gallery',
            'start_date' => '2026-03-25',
            'end_date' => '2026-03-27',
            'is_published' => true,
        ]);

        $imageId = $this->insertPromotionImage($promotionId, [
            'file_path' => 'promotions/mixed/image.webp',
            'original_name' => 'image-original.webp',
            'sort' => 5,
            'is_published' => true,
        ]);
        $videoId = $this->insertPromotionVideo($promotionId, [
            'file_path' => 'promotions/mixed/video.mp4',
            'original_name' => 'video-original.mp4',
            'poster_path' => 'promotions/mixed/video-poster.webp',
            'poster_original_name' => 'video-poster.webp',
            'mime' => 'video/mp4',
            'sort' => 5,
            'is_published' => true,
        ]);
        $this->insertPromotionVideo($promotionId, [
            'file_path' => 'promotions/mixed/hidden.mp4',
            'original_name' => 'hidden-original.mp4',
            'poster_path' => 'promotions/mixed/hidden-poster.webp',
            'poster_original_name' => 'hidden-poster.webp',
            'mime' => 'video/mp4',
            'sort' => 1,
            'is_published' => false,
        ]);

        $this->getJson("/api/v1/shop/{$shop->code}/promotion")
            ->assertOk()
            ->assertExactJson([
                [
                    'id' => $promotionId,
                    'code' => 'shop-mixed-promotion-video',
                    'title' => 'Mixed promotion',
                    'description' => 'Mixed promo gallery',
                    'startDate' => '2026-03-25',
                    'endDate' => '2026-03-27',
                    'galleryItems' => [
                        [
                            'id' => $imageId,
                            'type' => 'image',
                            'src' => Storage::disk((string) config('autoteka.media.disk', 'public'))->url('promotions/mixed/image.webp'),
                            'sort' => 5,
                        ],
                        [
                            'id' => $videoId,
                            'type' => 'video',
                            'src' => Storage::disk((string) config('autoteka.media.disk', 'public'))->url('promotions/mixed/video.mp4'),
                            'poster' => Storage::disk((string) config('autoteka.media.disk', 'public'))->url('promotions/mixed/video-poster.webp'),
                            'mime' => 'video/mp4',
                            'sort' => 5,
                        ],
                    ],
                ],
            ]);
    }

    public function test_promotion_endpoint_returns_text_only_promotions_with_empty_gallery_images(): void
    {
        $shop = $this->createPublishedShop('shop-text-only');
        $promotionId = $this->insertPromotion($shop->getKey(), [
            'code' => 'shop-text-only-promo',
            'title' => 'Text only promotion',
            'description' => 'No images here',
            'start_date' => '2026-03-25',
            'end_date' => '2026-03-27',
            'is_published' => true,
        ]);

        $this->getJson("/api/v1/shop/{$shop->code}/promotion")
            ->assertOk()
            ->assertExactJson([
                [
                    'id' => $promotionId,
                    'code' => 'shop-text-only-promo',
                    'title' => 'Text only promotion',
                    'description' => 'No images here',
                    'startDate' => '2026-03-25',
                    'endDate' => '2026-03-27',
                    'galleryItems' => [],
                ],
            ]);
    }

    public function test_promotion_endpoint_returns_404_for_unknown_or_unpublished_shop(): void
    {
        $city = City::query()->create([
            'code' => 'city-hidden',
            'title' => 'Hidden city',
            'sort' => 1,
            'is_published' => true,
        ]);
        Shop::query()->create([
            'code' => 'shop-hidden',
            'title' => 'Hidden shop',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => 'Hidden',
            'site_url' => '',
            'slogan' => null,
            'latitude' => null,
            'longitude' => null,
            'schedule_note' => null,
            'thumb_path' => null,
            'is_published' => false,
        ]);

        $this->getJson('/api/v1/shop/unknown/promotion')->assertNotFound();
        $this->getJson('/api/v1/shop/shop-hidden/promotion')->assertNotFound();
    }

    /**
     * @param  array{
     *     code: string,
     *     title: string,
     *     description: string,
     *     start_date: string,
     *     end_date: string,
     *     is_published: bool,
     * }  $data
     */
    private function insertPromotion(int $shopId, array $data): int
    {
        return (int) DB::table('promotion')->insertGetId([
            'shop_id' => $shopId,
            'code' => $data['code'],
            'title' => $data['title'],
            'description' => $data['description'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'is_published' => $data['is_published'],
            'created_at' => CarbonImmutable::now('UTC')->toDateTimeString(),
            'updated_at' => CarbonImmutable::now('UTC')->toDateTimeString(),
        ]);
    }

    /**
     * @param  array{
     *     file_path: string,
     *     original_name: string,
     *     sort: int,
     *     is_published: bool,
     * }  $data
     */
    private function insertPromotionImage(int $promotionId, array $data): int
    {
        return (int) DB::table('promotion_gallery_image')->insertGetId([
            'promotion_id' => $promotionId,
            'file_path' => $data['file_path'],
            'original_name' => $data['original_name'],
            'sort' => $data['sort'],
            'is_published' => $data['is_published'],
            'created_at' => CarbonImmutable::now('UTC')->toDateTimeString(),
            'updated_at' => CarbonImmutable::now('UTC')->toDateTimeString(),
        ]);
    }

    /**
     * @param  array{
     *     file_path: string,
     *     original_name: string,
     *     poster_path: string,
     *     poster_original_name: string,
     *     mime: string,
     *     sort: int,
     *     is_published: bool,
     * }  $data
     */
    private function insertPromotionVideo(int $promotionId, array $data): int
    {
        return (int) DB::table('promotion_gallery_video')->insertGetId([
            'promotion_id' => $promotionId,
            'file_path' => $data['file_path'],
            'original_name' => $data['original_name'],
            'poster_path' => $data['poster_path'],
            'poster_original_name' => $data['poster_original_name'],
            'mime' => $data['mime'],
            'sort' => $data['sort'],
            'is_published' => $data['is_published'],
            'created_at' => CarbonImmutable::now('UTC')->toDateTimeString(),
            'updated_at' => CarbonImmutable::now('UTC')->toDateTimeString(),
        ]);
    }

    private function createPublishedShop(string $code): Shop
    {
        $city = City::query()->create([
            'code' => "{$code}-city",
            'title' => 'Test city',
            'sort' => 1,
            'is_published' => true,
        ]);

        return Shop::query()->create([
            'code' => $code,
            'title' => 'Test shop',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => 'Test shop description',
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
