<?php

declare(strict_types=1);

namespace Tests\Feature;

use ShopOperator\Models\Category;
use ShopOperator\Models\City;
use ShopOperator\Models\ContactType;
use ShopOperator\Models\Feature;
use ShopOperator\Models\ShopContact;
use ShopOperator\Models\Shop;
use ShopOperator\MoonShine\Handlers\SaveShopResourceHandler;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

final class SaveShopResourceHandlerTest extends TestCase
{
    use RefreshDatabase;

    public function test_save_handler_saves_shop_with_virtual_fields(): void
    {
        $city = City::query()->create([
            'code' => 'test-city',
            'title' => 'Test City',
            'sort' => 0,
            'is_published' => true,
        ]);

        $category = Category::query()->create([
            'code' => 'test-category',
            'title' => 'Test Category',
            'sort' => 0,
            'is_published' => true,
        ]);

        $feature = Feature::query()->create([
            'code' => 'test-feature',
            'title' => 'Test Feature',
            'sort' => 0,
            'is_published' => true,
        ]);

        $contactType = ContactType::query()->create([
            'code' => 'phone',
            'title' => 'Phone',
            'sort' => 0,
            'is_published' => true,
        ]);

        $shop = Shop::query()->create([
            'code' => 'test-shop',
            'title' => 'Old Name',
            'sort' => 0,
            'city_id' => $city->getKey(),
            'description' => '',
            'site_url' => 'example.com/shop',
            'slogan' => null,
            'latitude' => null,
            'longitude' => null,
            'schedule_note' => null,
            'thumb_path' => null,
            'is_published' => true,
        ]);

        $handler = app(SaveShopResourceHandler::class);

        $result = $handler($shop, [
            'code' => 'test-shop',
            'title' => 'New Name',
            'sort' => 10,
            'city_id' => $city->getKey(),
            'description' => 'Updated',
            'site_url' => 'example.com/shop',
            'slogan' => 'Лучшие автотовары',
            'latitude' => 55.0287,
            'longitude' => 82.9235,
            'schedule_note' => 'Всегда открыты',
            'thumb_path' => null,
            'is_published' => true,
            'category_links' => [
                ['category_id' => $category->getKey(), 'is_published' => true],
            ],
            'feature_links' => [
                ['feature_id' => $feature->getKey(), 'is_published' => true],
            ],
            'contact_entries' => [
                [
                    'contact_type_id' => $contactType->getKey(),
                    'value' => '+7 900 000 00 00',
                    'sort' => 0,
                    'is_published' => true,
                ],
            ],
            'gallery_entries' => [],
            'schedule_entries' => [],
        ]);

        self::assertSame('New Name', $result->title);

        $this->assertDatabaseHas('shop', [
            'id' => $shop->getKey(),
            'title' => 'New Name',
            'sort' => 10,
            'city_id' => $city->getKey(),
            'site_url' => 'example.com/shop',
            'slogan' => 'Лучшие автотовары',
            'latitude' => 55.0287,
            'longitude' => 82.9235,
            'schedule_note' => 'Всегда открыты',
        ]);

        $this->assertDatabaseHas('shop_category', [
            'shop_id' => $shop->getKey(),
            'category_id' => $category->getKey(),
            'is_published' => 1,
        ]);

        $this->assertDatabaseHas('shop_feature', [
            'shop_id' => $shop->getKey(),
            'feature_id' => $feature->getKey(),
            'is_published' => 1,
        ]);

        $this->assertDatabaseHas('shop_contact', [
            'shop_id' => $shop->getKey(),
            'contact_type_id' => $contactType->getKey(),
            'value' => '+7 900 000 00 00',
        ]);
    }

    public function test_save_handler_rejects_invalid_latitude_value(): void
    {
        $city = City::query()->create([
            'code' => 'invalid-coords-city',
            'title' => 'Invalid Coords City',
            'sort' => 0,
            'is_published' => true,
        ]);

        $shop = Shop::query()->create([
            'code' => 'invalid-coords-shop',
            'title' => 'Invalid Coords Shop',
            'sort' => 0,
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

        $handler = app(SaveShopResourceHandler::class);

        try {
            $handler($shop, [
                'code' => 'invalid-coords-shop',
                'title' => 'Invalid Coords Shop',
                'sort' => 1,
                'city_id' => $city->getKey(),
                'description' => '',
                'site_url' => '',
                'slogan' => null,
                'latitude' => 'not-a-number',
                'longitude' => '82.9235',
                'schedule_note' => '',
                'thumb_path' => null,
                'is_published' => true,
                'category_links' => [],
                'feature_links' => [],
                'contact_entries' => [],
                'gallery_entries' => [],
                'schedule_entries' => [],
            ]);

            self::fail('Expected ValidationException for invalid latitude.');
        } catch (ValidationException $exception) {
            self::assertArrayHasKey('latitude', $exception->errors());
        }
    }

    public function test_save_handler_rejects_invalid_longitude_value(): void
    {
        $city = City::query()->create([
            'code' => 'invalid-longitude-city',
            'title' => 'Invalid Longitude City',
            'sort' => 0,
            'is_published' => true,
        ]);

        $shop = Shop::query()->create([
            'code' => 'invalid-longitude-shop',
            'title' => 'Invalid Longitude Shop',
            'sort' => 0,
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

        $handler = app(SaveShopResourceHandler::class);

        try {
            $handler($shop, [
                'code' => 'invalid-longitude-shop',
                'title' => 'Invalid Longitude Shop',
                'sort' => 1,
                'city_id' => $city->getKey(),
                'description' => '',
                'site_url' => '',
                'slogan' => null,
                'latitude' => '55.0287',
                'longitude' => 'not-a-number',
                'schedule_note' => '',
                'thumb_path' => null,
                'is_published' => true,
                'category_links' => [],
                'feature_links' => [],
                'contact_entries' => [],
                'gallery_entries' => [],
                'schedule_entries' => [],
            ]);

            self::fail('Expected ValidationException for invalid longitude.');
        } catch (ValidationException $exception) {
            self::assertArrayHasKey('longitude', $exception->errors());
        }
    }

    public function test_save_handler_deletes_existing_nested_rows_when_virtual_fields_are_empty(): void
    {
        $city = City::query()->create([
            'code' => 'test-city-delete',
            'title' => 'Test City Delete',
            'sort' => 0,
            'is_published' => true,
        ]);

        $contactType = ContactType::query()->create([
            'code' => 'phone-delete',
            'title' => 'Phone Delete',
            'sort' => 0,
            'is_published' => true,
        ]);

        $shop = Shop::query()->create([
            'code' => 'test-shop-delete',
            'title' => 'Old Name',
            'sort' => 0,
            'city_id' => $city->getKey(),
            'description' => '',
            'site_url' => '',
            'slogan' => null,
            'latitude' => null,
            'longitude' => null,
            'schedule_note' => 'Old note',
            'thumb_path' => null,
            'is_published' => true,
        ]);

        $contactId = DB::table('shop_contact')->insertGetId([
            'shop_id' => $shop->getKey(),
            'contact_type_id' => $contactType->getKey(),
            'value' => '+7 900 111 11 11',
            'sort' => 1,
            'is_published' => 1,
        ]);

        $galleryId = DB::table('shop_gallery_image')->insertGetId([
            'shop_id' => $shop->getKey(),
            'file_path' => 'shops/gallery/delete-me.jpg',
            'sort' => 1,
            'is_published' => 1,
        ]);

        $scheduleId = DB::table('shop_schedule')->insertGetId([
            'shop_id' => $shop->getKey(),
            'weekday' => 1,
            'time_from' => '09:00',
            'time_to' => '18:00',
            'sort' => 1,
            'is_published' => 1,
        ]);

        $handler = app(SaveShopResourceHandler::class);

        $handler($shop, [
            'code' => 'test-shop-delete',
            'title' => 'New Name',
            'sort' => 10,
            'city_id' => $city->getKey(),
            'description' => 'Updated',
            'site_url' => 'https://example.com',
            'slogan' => null,
            'latitude' => null,
            'longitude' => null,
            'schedule_note' => '',
            'thumb_path' => null,
            'is_published' => true,
            'category_links' => [],
            'feature_links' => [],
            'contact_entries' => [],
            'gallery_entries' => [],
            'schedule_entries' => [],
            'schedule_note' => '',
        ]);

        $this->assertDatabaseMissing('shop_contact', ['id' => $contactId]);
        $this->assertDatabaseMissing('shop_gallery_image', ['id' => $galleryId]);
        $this->assertDatabaseMissing('shop_schedule', ['id' => $scheduleId]);
        $this->assertDatabaseHas('shop', [
            'id' => $shop->getKey(),
            'schedule_note' => null,
        ]);
    }

    public function test_save_handler_persists_shop_gallery_video_rows_with_required_poster(): void
    {
        $city = City::query()->create([
            'code' => 'video-city',
            'title' => 'Video City',
            'sort' => 0,
            'is_published' => true,
        ]);

        $shop = Shop::query()->create([
            'code' => 'video-shop',
            'title' => 'Video Shop',
            'sort' => 0,
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

        $handler = app(SaveShopResourceHandler::class);

        $handler($shop, [
            'code' => 'video-shop',
            'title' => 'Video Shop',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => '',
            'site_url' => '',
            'slogan' => null,
            'latitude' => null,
            'longitude' => null,
            'schedule_note' => '',
            'thumb_path' => null,
            'is_published' => true,
            'category_links' => [],
            'feature_links' => [],
            'contact_entries' => [],
            'gallery_entries' => [],
            'gallery_video_entries' => [
                [
                    'file_path' => 'shops/gallery-video/video-1.mp4',
                    'poster_path' => 'shops/gallery-video-poster/video-1.webp',
                    'original_name' => 'video-1.mp4',
                    'poster_original_name' => 'video-1.webp',
                    'mime' => 'video/mp4',
                    'sort' => 1,
                    'is_published' => true,
                ],
            ],
            'schedule_entries' => [],
        ]);

        $this->assertDatabaseHas('shop_gallery_video', [
            'shop_id' => $shop->getKey(),
            'file_path' => 'shops/gallery-video/video-1.mp4',
            'poster_path' => 'shops/gallery-video-poster/video-1.webp',
            'original_name' => 'video-1.mp4',
            'poster_original_name' => 'video-1.webp',
            'mime' => 'video/mp4',
            'sort' => 1,
            'is_published' => 1,
        ]);
    }

    public function test_save_handler_rejects_shop_gallery_video_rows_without_poster(): void
    {
        $city = City::query()->create([
            'code' => 'video-poster-city',
            'title' => 'Video Poster City',
            'sort' => 0,
            'is_published' => true,
        ]);

        $shop = Shop::query()->create([
            'code' => 'video-poster-shop',
            'title' => 'Video Poster Shop',
            'sort' => 0,
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

        $handler = app(SaveShopResourceHandler::class);

        try {
            $handler($shop, [
                'code' => 'video-poster-shop',
                'title' => 'Video Poster Shop',
                'sort' => 1,
                'city_id' => $city->getKey(),
                'description' => '',
                'site_url' => '',
                'slogan' => null,
                'latitude' => null,
                'longitude' => null,
                'schedule_note' => '',
                'thumb_path' => null,
                'is_published' => true,
                'category_links' => [],
                'feature_links' => [],
                'contact_entries' => [],
                'gallery_entries' => [],
                'gallery_video_entries' => [
                    [
                        'file_path' => 'shops/gallery-video/video-2.mp4',
                        'original_name' => 'video-2.mp4',
                        'mime' => 'video/mp4',
                        'sort' => 1,
                        'is_published' => true,
                    ],
                ],
                'schedule_entries' => [],
            ]);

            self::fail('Expected ValidationException for missing poster on shop video gallery row.');
        } catch (ValidationException $exception) {
            self::assertArrayHasKey('gallery_video_entries', $exception->errors());
        }
    }

    public function test_save_handler_replaces_shop_gallery_video_files_and_cleans_up_removed_rows(): void
    {
        Storage::fake((string) config('autoteka.media.disk', 'public'));
        $disk = Storage::disk((string) config('autoteka.media.disk', 'public'));

        $city = City::query()->create([
            'code' => 'video-cleanup-city',
            'title' => 'Video Cleanup City',
            'sort' => 0,
            'is_published' => true,
        ]);

        $shop = Shop::query()->create([
            'code' => 'video-cleanup-shop',
            'title' => 'Video Cleanup Shop',
            'sort' => 0,
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

        $oldVideoPath = 'shops/gallery-video/old.mp4';
        $oldPosterPath = 'shops/gallery-video-poster/old.webp';
        $updatedVideoPath = 'shops/gallery-video/new.mp4';
        $updatedPosterPath = 'shops/gallery-video-poster/new.webp';
        $disk->put($oldVideoPath, 'old-video');
        $disk->put($oldPosterPath, 'old-poster');
        $disk->put($updatedVideoPath, 'new-video');
        $disk->put($updatedPosterPath, 'new-poster');

        $videoId = DB::table('shop_gallery_video')->insertGetId([
            'shop_id' => $shop->getKey(),
            'file_path' => $oldVideoPath,
            'original_name' => 'old.mp4',
            'poster_path' => $oldPosterPath,
            'poster_original_name' => 'old.webp',
            'mime' => 'video/mp4',
            'sort' => 1,
            'is_published' => 1,
            'created_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ]);

        $handler = app(SaveShopResourceHandler::class);

        $handler($shop, [
            'code' => 'video-cleanup-shop',
            'title' => 'Video Cleanup Shop',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => '',
            'site_url' => '',
            'slogan' => null,
            'latitude' => null,
            'longitude' => null,
            'schedule_note' => '',
            'thumb_path' => null,
            'is_published' => true,
            'category_links' => [],
            'feature_links' => [],
            'contact_entries' => [],
            'gallery_entries' => [],
            'gallery_video_entries' => [
                [
                    'id' => $videoId,
                    'file_path' => $updatedVideoPath,
                    'poster_path' => $updatedPosterPath,
                    'original_name' => 'new.mp4',
                    'poster_original_name' => 'new.webp',
                    'mime' => 'video/mp4',
                    'sort' => 1,
                    'is_published' => true,
                ],
            ],
            'schedule_entries' => [],
        ]);

        $this->assertDatabaseHas('shop_gallery_video', [
            'id' => $videoId,
            'shop_id' => $shop->getKey(),
            'file_path' => $updatedVideoPath,
            'poster_path' => $updatedPosterPath,
        ]);
        $disk->assertMissing($oldVideoPath);
        $disk->assertMissing($oldPosterPath);
    }

    public function test_save_handler_allows_multiple_contacts_with_same_type_and_preserves_order(): void
    {
        $city = City::query()->create([
            'code' => 'dup-city',
            'title' => 'Dup City',
            'sort' => 0,
            'is_published' => true,
        ]);

        $contactType = ContactType::query()->create([
            'code' => 'dup-phone',
            'title' => 'Dup Phone',
            'sort' => 0,
            'is_published' => true,
        ]);

        $shop = Shop::query()->create([
            'code' => 'dup-shop',
            'title' => 'Dup Shop',
            'sort' => 0,
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

        $handler = app(SaveShopResourceHandler::class);

        $handler($shop, [
            'code' => 'dup-shop',
            'title' => 'Dup Shop',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => '',
            'site_url' => '',
            'thumb_path' => null,
            'is_published' => true,
            'category_links' => [],
            'feature_links' => [],
            'contact_entries' => [
                [
                    'contact_type_id' => $contactType->getKey(),
                    'value' => '+7 900 000 00 00',
                    'sort' => 1,
                    'is_published' => true,
                ],
                [
                    'contact_type_id' => $contactType->getKey(),
                    'value' => '+7 900 000 00 01',
                    'sort' => 2,
                    'is_published' => true,
                ],
            ],
            'gallery_entries' => [],
            'schedule_entries' => [],
            'schedule_note' => '',
        ]);

        $this->assertDatabaseHas('shop_contact', [
            'shop_id' => $shop->getKey(),
            'contact_type_id' => $contactType->getKey(),
            'value' => '+7 900 000 00 00',
            'sort' => 1,
            'is_published' => 1,
        ]);
        $this->assertDatabaseHas('shop_contact', [
            'shop_id' => $shop->getKey(),
            'contact_type_id' => $contactType->getKey(),
            'value' => '+7 900 000 00 01',
            'sort' => 2,
            'is_published' => 1,
        ]);

        self::assertSame(
            [1, 2],
            ShopContact::query()
                ->where('shop_id', $shop->getKey())
                ->orderBy('sort')
                ->pluck('sort')
                ->all(),
        );
    }

    public function test_save_handler_deletes_old_gallery_files_when_replaced_or_removed(): void
    {
        Storage::fake((string) config('autoteka.media.disk', 'public'));
        $disk = Storage::disk((string) config('autoteka.media.disk', 'public'));

        $city = City::query()->create([
            'code' => 'gallery-city',
            'title' => 'Gallery City',
            'sort' => 0,
            'is_published' => true,
        ]);

        $shop = Shop::query()->create([
            'code' => 'gallery-shop',
            'title' => 'Gallery Shop',
            'sort' => 0,
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

        $oldPathToReplace = 'shops/gallery/old-replace.jpg';
        $oldPathToDelete = 'shops/gallery/old-delete.jpg';
        $newPath = 'shops/gallery/new.jpg';
        $disk->put($oldPathToReplace, 'old-1');
        $disk->put($oldPathToDelete, 'old-2');
        $disk->put($newPath, 'new');

        $replaceId = DB::table('shop_gallery_image')->insertGetId([
            'shop_id' => $shop->getKey(),
            'file_path' => $oldPathToReplace,
            'sort' => 1,
            'is_published' => 1,
        ]);
        DB::table('shop_gallery_image')->insertGetId([
            'shop_id' => $shop->getKey(),
            'file_path' => $oldPathToDelete,
            'sort' => 2,
            'is_published' => 1,
        ]);

        $handler = app(SaveShopResourceHandler::class);

        $handler($shop, [
            'code' => 'gallery-shop',
            'title' => 'Gallery Shop',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => '',
            'site_url' => '',
            'thumb_path' => null,
            'is_published' => true,
            'category_links' => [],
            'feature_links' => [],
            'contact_entries' => [],
            'gallery_entries' => [
                [
                    'id' => $replaceId,
                    'file_path' => $newPath,
                    'sort' => 1,
                    'is_published' => true,
                ],
            ],
            'schedule_entries' => [],
            'schedule_note' => '',
        ]);

        $this->assertDatabaseHas('shop_gallery_image', [
            'id' => $replaceId,
            'shop_id' => $shop->getKey(),
            'file_path' => $newPath,
        ]);
        $disk->assertMissing($oldPathToReplace);
        $disk->assertMissing($oldPathToDelete);
    }

    public function test_save_handler_updates_schedule_note_column(): void
    {
        $city = City::query()->create([
            'code' => 'note-city',
            'title' => 'Note City',
            'sort' => 0,
            'is_published' => true,
        ]);

        $shop = Shop::query()->create([
            'code' => 'note-shop',
            'title' => 'Note Shop',
            'sort' => 0,
            'city_id' => $city->getKey(),
            'description' => '',
            'site_url' => '',
            'slogan' => null,
            'latitude' => null,
            'longitude' => null,
            'schedule_note' => 'Old note',
            'thumb_path' => null,
            'is_published' => true,
        ]);

        $handler = app(SaveShopResourceHandler::class);

        $handler($shop, [
            'code' => 'note-shop',
            'title' => 'Note Shop',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => '',
            'site_url' => '',
            'slogan' => null,
            'latitude' => null,
            'longitude' => null,
            'schedule_note' => 'New note',
            'thumb_path' => null,
            'is_published' => true,
            'category_links' => [],
            'feature_links' => [],
            'contact_entries' => [],
            'gallery_entries' => [],
            'schedule_entries' => [],
        ]);

        $this->assertDatabaseHas('shop', [
            'id' => $shop->getKey(),
            'schedule_note' => 'New note',
        ]);
    }

    public function test_save_handler_syncs_category_and_feature_links_with_detach(): void
    {
        $city = City::query()->create([
            'code' => 'sync-city',
            'title' => 'Sync City',
            'sort' => 0,
            'is_published' => true,
        ]);

        $categoryOld = Category::query()->create([
            'code' => 'cat-old',
            'title' => 'Cat Old',
            'sort' => 1,
            'is_published' => true,
        ]);
        $categoryNew = Category::query()->create([
            'code' => 'cat-new',
            'title' => 'Cat New',
            'sort' => 2,
            'is_published' => true,
        ]);
        $featureOld = Feature::query()->create([
            'code' => 'feature-old',
            'title' => 'Feature Old',
            'sort' => 1,
            'is_published' => true,
        ]);
        $featureNew = Feature::query()->create([
            'code' => 'feature-new',
            'title' => 'Feature New',
            'sort' => 2,
            'is_published' => true,
        ]);

        $shop = Shop::query()->create([
            'code' => 'sync-shop',
            'title' => 'Sync Shop',
            'sort' => 0,
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

        $shop->categories()->sync([
            $categoryOld->getKey() => ['is_published' => true],
        ]);
        $shop->features()->sync([
            $featureOld->getKey() => ['is_published' => true],
        ]);

        $handler = app(SaveShopResourceHandler::class);

        $handler($shop, [
            'code' => 'sync-shop',
            'title' => 'Sync Shop',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => '',
            'site_url' => '',
            'thumb_path' => null,
            'is_published' => true,
            'category_links' => [
                ['category_id' => $categoryNew->getKey(), 'is_published' => true],
            ],
            'feature_links' => [
                ['feature_id' => $featureNew->getKey(), 'is_published' => true],
            ],
            'contact_entries' => [],
            'gallery_entries' => [],
            'schedule_entries' => [],
            'schedule_note' => '',
        ]);

        $this->assertDatabaseHas('shop_category', [
            'shop_id' => $shop->getKey(),
            'category_id' => $categoryNew->getKey(),
        ]);
        $this->assertDatabaseMissing('shop_category', [
            'shop_id' => $shop->getKey(),
            'category_id' => $categoryOld->getKey(),
        ]);
        $this->assertDatabaseHas('shop_feature', [
            'shop_id' => $shop->getKey(),
            'feature_id' => $featureNew->getKey(),
        ]);
        $this->assertDatabaseMissing('shop_feature', [
            'shop_id' => $shop->getKey(),
            'feature_id' => $featureOld->getKey(),
        ]);
    }

    public function test_save_handler_rejects_category_link_row_without_is_published(): void
    {
        $city = City::query()->create([
            'code' => 'no-pivot-city',
            'title' => 'No Pivot City',
            'sort' => 0,
            'is_published' => true,
        ]);
        $category = Category::query()->create([
            'code' => 'no-pivot-cat',
            'title' => 'No Pivot Cat',
            'sort' => 0,
            'is_published' => true,
        ]);
        $shop = Shop::query()->create([
            'code' => 'no-pivot-shop',
            'title' => 'No Pivot Shop',
            'sort' => 0,
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

        $handler = app(SaveShopResourceHandler::class);

        try {
            $handler($shop, [
                'code' => 'no-pivot-shop',
                'title' => 'No Pivot Shop',
                'sort' => 0,
                'city_id' => $city->getKey(),
                'description' => '',
                'site_url' => '',
                'slogan' => null,
                'latitude' => null,
                'longitude' => null,
                'schedule_note' => null,
                'thumb_path' => null,
                'is_published' => true,
                'category_links' => [
                    ['category_id' => $category->getKey()],
                ],
                'feature_links' => [],
                'contact_entries' => [],
                'gallery_entries' => [],
                'schedule_entries' => [],
            ]);
            self::fail('Expected ValidationException for missing category is_published.');
        } catch (ValidationException $exception) {
            self::assertArrayHasKey('category_links', $exception->errors());
        }
    }

    public function test_save_handler_persists_pivot_is_published_false(): void
    {
        $city = City::query()->create([
            'code' => 'pivot-f-city',
            'title' => 'Pivot F City',
            'sort' => 0,
            'is_published' => true,
        ]);
        $category = Category::query()->create([
            'code' => 'pivot-f-cat',
            'title' => 'Pivot F Cat',
            'sort' => 0,
            'is_published' => true,
        ]);
        $feature = Feature::query()->create([
            'code' => 'pivot-f-feat',
            'title' => 'Pivot F Feat',
            'sort' => 0,
            'is_published' => true,
        ]);
        $shop = Shop::query()->create([
            'code' => 'pivot-f-shop',
            'title' => 'Pivot F Shop',
            'sort' => 0,
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

        $handler = app(SaveShopResourceHandler::class);

        $handler($shop, [
            'code' => 'pivot-f-shop',
            'title' => 'Pivot F Shop',
            'sort' => 0,
            'city_id' => $city->getKey(),
            'description' => '',
            'site_url' => '',
            'slogan' => null,
            'latitude' => null,
            'longitude' => null,
            'schedule_note' => null,
            'thumb_path' => null,
            'is_published' => true,
            'category_links' => [
                ['category_id' => $category->getKey(), 'is_published' => false],
            ],
            'feature_links' => [
                ['feature_id' => $feature->getKey(), 'is_published' => false],
            ],
            'contact_entries' => [],
            'gallery_entries' => [],
            'schedule_entries' => [],
        ]);

        $this->assertDatabaseHas('shop_category', [
            'shop_id' => $shop->getKey(),
            'category_id' => $category->getKey(),
            'is_published' => 0,
        ]);
        $this->assertDatabaseHas('shop_feature', [
            'shop_id' => $shop->getKey(),
            'feature_id' => $feature->getKey(),
            'is_published' => 0,
        ]);
    }

    public function test_save_handler_rejects_duplicate_contacts_when_values_normalize_to_same_digits(): void
    {
        $city = City::query()->create([
            'code' => 'dup-norm-city',
            'title' => 'Dup Norm City',
            'sort' => 0,
            'is_published' => true,
        ]);
        $contactType = ContactType::query()->create([
            'code' => 'dup-norm-phone',
            'title' => 'Dup Norm Phone',
            'sort' => 0,
            'is_published' => true,
        ]);
        $shop = Shop::query()->create([
            'code' => 'dup-norm-shop',
            'title' => 'Dup Norm Shop',
            'sort' => 0,
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

        $handler = app(SaveShopResourceHandler::class);

        try {
            $handler($shop, [
                'code' => 'dup-norm-shop',
                'title' => 'Dup Norm Shop',
                'sort' => 0,
                'city_id' => $city->getKey(),
                'description' => '',
                'site_url' => '',
                'thumb_path' => null,
                'is_published' => true,
                'category_links' => [],
                'feature_links' => [],
                'contact_entries' => [
                    [
                        'contact_type_id' => $contactType->getKey(),
                        'value' => '+7 (900) 111-22-33',
                        'sort' => 0,
                        'is_published' => true,
                    ],
                    [
                        'contact_type_id' => $contactType->getKey(),
                        'value' => '79001112233',
                        'sort' => 1,
                        'is_published' => true,
                    ],
                ],
                'gallery_entries' => [],
                'schedule_entries' => [],
            ]);
            self::fail('Expected ValidationException for duplicate normalized contacts.');
        } catch (ValidationException $exception) {
            self::assertArrayHasKey('contact_entries', $exception->errors());
        }
    }
}
