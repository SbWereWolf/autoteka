<?php

declare(strict_types=1);

namespace Tests\Feature;

use ShopOperator\Models\Category;
use ShopOperator\Models\City;
use ShopOperator\Models\ContactType;
use ShopOperator\Models\Feature;
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
            'site_url' => '',
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
            'site_url' => 'https://example.com',
            'thumb_path' => null,
            'is_published' => true,
            'category_links' => [
                ['category_id' => $category->getKey()],
            ],
            'feature_links' => [
                ['feature_id' => $feature->getKey()],
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
            'schedule_note_text' => '',
        ]);

        self::assertSame('New Name', $result->title);

        $this->assertDatabaseHas('shop', [
            'id' => $shop->getKey(),
            'title' => 'New Name',
            'sort' => 10,
            'city_id' => $city->getKey(),
        ]);

        $this->assertDatabaseHas('shop_category', [
            'shop_id' => $shop->getKey(),
            'category_id' => $category->getKey(),
        ]);

        $this->assertDatabaseHas('shop_feature', [
            'shop_id' => $shop->getKey(),
            'feature_id' => $feature->getKey(),
        ]);

        $this->assertDatabaseHas('shop_contact', [
            'shop_id' => $shop->getKey(),
            'contact_type_id' => $contactType->getKey(),
            'value' => '+7 900 000 00 00',
        ]);
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

        DB::table('shop_schedule_note')->insert([
            'shop_id' => $shop->getKey(),
            'text' => 'Old note',
            'sort' => 0,
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
            'thumb_path' => null,
            'is_published' => true,
            'category_links' => [],
            'feature_links' => [],
            'contact_entries' => [],
            'gallery_entries' => [],
            'schedule_entries' => [],
            'schedule_note_text' => '',
        ]);

        $this->assertDatabaseMissing('shop_contact', ['id' => $contactId]);
        $this->assertDatabaseMissing('shop_gallery_image', ['id' => $galleryId]);
        $this->assertDatabaseMissing('shop_schedule', ['id' => $scheduleId]);
        $this->assertDatabaseMissing('shop_schedule_note', ['shop_id' => $shop->getKey()]);
    }

    public function test_save_handler_rejects_duplicate_contacts_case_insensitive(): void
    {
        $this->expectException(ValidationException::class);

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
                    'value' => 'Test@Example.COM',
                    'sort' => 1,
                    'is_published' => true,
                ],
                [
                    'contact_type_id' => $contactType->getKey(),
                    'value' => 'test@example.com',
                    'sort' => 2,
                    'is_published' => true,
                ],
            ],
            'gallery_entries' => [],
            'schedule_entries' => [],
            'schedule_note_text' => '',
        ]);
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
            'schedule_note_text' => '',
        ]);

        $this->assertDatabaseHas('shop_gallery_image', [
            'id' => $replaceId,
            'shop_id' => $shop->getKey(),
            'file_path' => $newPath,
        ]);
        $disk->assertMissing($oldPathToReplace);
        $disk->assertMissing($oldPathToDelete);
    }

    public function test_save_handler_replaces_existing_schedule_note_text(): void
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
            'thumb_path' => null,
            'is_published' => true,
        ]);

        DB::table('shop_schedule_note')->insert([
            'shop_id' => $shop->getKey(),
            'text' => 'Old note',
            'sort' => 0,
            'is_published' => 1,
        ]);

        $handler = app(SaveShopResourceHandler::class);

        $handler($shop, [
            'code' => 'note-shop',
            'title' => 'Note Shop',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => '',
            'site_url' => '',
            'thumb_path' => null,
            'is_published' => true,
            'category_links' => [],
            'feature_links' => [],
            'contact_entries' => [],
            'gallery_entries' => [],
            'schedule_entries' => [],
            'schedule_note_text' => 'New note',
        ]);

        $this->assertDatabaseHas('shop_schedule_note', [
            'shop_id' => $shop->getKey(),
            'text' => 'New note',
            'sort' => 0,
            'is_published' => 1,
        ]);
        self::assertSame(
            1,
            DB::table('shop_schedule_note')->where('shop_id', $shop->getKey())->count()
        );
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
            'thumb_path' => null,
            'is_published' => true,
        ]);

        $shop->categories()->sync([$categoryOld->getKey()]);
        $shop->features()->sync([$featureOld->getKey()]);

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
                ['category_id' => $categoryNew->getKey()],
            ],
            'feature_links' => [
                ['feature_id' => $featureNew->getKey()],
            ],
            'contact_entries' => [],
            'gallery_entries' => [],
            'schedule_entries' => [],
            'schedule_note_text' => '',
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
}
