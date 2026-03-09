<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\City;
use App\Models\ContactType;
use App\Models\Feature;
use App\Models\Shop;
use App\Models\ShopContact;
use App\Models\ShopGalleryImage;
use App\Models\ShopSchedule;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use MoonShine\Laravel\Models\MoonshineUser;
use MoonShine\Laravel\Models\MoonshineUserRole;
use Tests\TestCase;

final class AdminHttpShopCrudUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_shop_resource_over_http_for_base_fields(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        Storage::fake((string) config('autoteka.media.disk', 'public'));

        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $cityA = City::query()->create([
            'code' => 'city-a',
            'title' => 'City A',
            'sort' => 1,
            'is_published' => true,
        ]);
        $cityB = City::query()->create([
            'code' => 'city-b',
            'title' => 'City B',
            'sort' => 2,
            'is_published' => true,
        ]);
        $category = Category::query()->create([
            'code' => 'cat-a',
            'title' => 'Category A',
            'sort' => 1,
            'is_published' => true,
        ]);
        $feature = Feature::query()->create([
            'code' => 'feat-a',
            'title' => 'Feature A',
            'sort' => 1,
            'is_published' => true,
        ]);
        $contactType = ContactType::query()->create([
            'code' => 'phone',
            'title' => 'Телефон',
            'sort' => 1,
            'is_published' => true,
        ]);
        $shop = Shop::query()->create([
            'code' => 'shop-old',
            'title' => 'Shop Old',
            'sort' => 10,
            'city_id' => $cityA->getKey(),
            'description' => 'Old description',
            'site_url' => 'https://old.example.com',
            'thumb_path' => null,
            'is_published' => true,
        ]);

        $thumb = UploadedFile::fake()->image('thumb.jpg', 1200, 800);
        $galleryDisk = (string) config('autoteka.media.disk', 'public');
        $existingGalleryPath = 'shops/gallery/existing-gallery.jpg';
        Storage::disk($galleryDisk)->put($existingGalleryPath, 'fake-image-content');

        $response = $this->post(
            route('moonshine.crud.update', [
                'resourceUri' => 'shop-resource',
                'resourceItem' => $shop->getKey(),
            ]),
            [
                '_method' => 'PATCH',
                'code' => 'shop-new',
                'title' => 'Shop New',
                'sort' => 55,
                'city_id' => $cityB->getKey(),
                'description' => 'Updated description',
                'site_url' => 'https://example.com/shop-new',
                'thumb_path' => $thumb,
                'is_published' => '0',
                'category_links' => [
                    [
                        'category_id' => $category->getKey(),
                    ],
                ],
                'feature_links' => [
                    [
                        'feature_id' => $feature->getKey(),
                    ],
                ],
                'contact_entries' => [
                    [
                        'contact_type_id' => $contactType->getKey(),
                        'value' => '+7 (900) 000-00-00',
                        'sort' => 1,
                        'is_published' => true,
                    ],
                ],
                'gallery_entries' => [
                    [
                        'hidden_file_path' => $existingGalleryPath,
                        'sort' => 1,
                        'is_published' => true,
                    ],
                ],
                'schedule_entries' => [
                    [
                        'weekday' => 1,
                        'time_from' => '09:00',
                        'time_to' => '18:00',
                        'sort' => 1,
                        'is_published' => true,
                    ],
                ],
                'schedule_note_text' => 'Тестовая заметка',
            ]
        );

        $response->assertStatus(302);

        $this->assertDatabaseHas('shop', [
            'id' => $shop->getKey(),
            'code' => 'shop-new',
            'title' => 'Shop New',
            'sort' => 55,
            'city_id' => $cityB->getKey(),
            'description' => 'Updated description',
            'site_url' => 'https://example.com/shop-new',
            'is_published' => 0,
        ]);
        $shop->refresh();
        self::assertNotNull($shop->thumb_path);
        self::assertStringContainsString('shops/thumbs', (string) $shop->thumb_path);
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
            'value' => '+7 (900) 000-00-00',
            'sort' => 1,
            'is_published' => 1,
        ]);
        $this->assertDatabaseHas('shop_gallery_image', [
            'shop_id' => $shop->getKey(),
            'file_path' => $existingGalleryPath,
            'sort' => 1,
            'is_published' => 1,
        ]);
        $this->assertDatabaseHas('shop_schedule', [
            'shop_id' => $shop->getKey(),
            'weekday' => 1,
            'time_from' => '09:00',
            'time_to' => '18:00',
            'sort' => 1,
            'is_published' => 1,
        ]);
        $this->assertDatabaseHas('shop_schedule_note', [
            'shop_id' => $shop->getKey(),
            'text' => 'Тестовая заметка',
            'sort' => 0,
            'is_published' => 1,
        ]);
    }

    public function test_admin_can_update_existing_nested_shop_rows_by_id_over_http(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        Storage::fake((string) config('autoteka.media.disk', 'public'));

        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $city = City::query()->create([
            'code' => 'city-c',
            'title' => 'City C',
            'sort' => 1,
            'is_published' => true,
        ]);
        $contactType = ContactType::query()->create([
            'code' => 'phone-2',
            'title' => 'Телефон 2',
            'sort' => 1,
            'is_published' => true,
        ]);
        $shop = Shop::query()->create([
            'code' => 'shop-edit-old',
            'title' => 'Shop Edit Old',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'is_published' => true,
        ]);

        $contact = ShopContact::query()->create([
            'shop_id' => $shop->getKey(),
            'contact_type_id' => $contactType->getKey(),
            'value' => '+7 900 111 11 11',
            'sort' => 1,
            'is_published' => true,
        ]);
        $gallery = ShopGalleryImage::query()->create([
            'shop_id' => $shop->getKey(),
            'file_path' => 'shops/gallery/old-image.jpg',
            'sort' => 1,
            'is_published' => true,
        ]);
        $schedule = ShopSchedule::query()->create([
            'shop_id' => $shop->getKey(),
            'weekday' => 1,
            'time_from' => '09:00',
            'time_to' => '18:00',
            'sort' => 1,
            'is_published' => true,
        ]);

        Storage::disk((string) config('autoteka.media.disk', 'public'))->put('shops/gallery/new-image.jpg', 'new-image');

        $response = $this->post(
            route('moonshine.crud.update', [
                'resourceUri' => 'shop-resource',
                'resourceItem' => $shop->getKey(),
            ]),
            [
                '_method' => 'PATCH',
                'code' => 'shop-edit-new',
                'title' => 'Shop Edit New',
                'sort' => 2,
                'city_id' => $city->getKey(),
                'is_published' => '1',
                'contact_entries' => [
                    [
                        'id' => $contact->getKey(),
                        'contact_type_id' => $contactType->getKey(),
                        'value' => '+7 900 222 22 22',
                        'sort' => 9,
                        'is_published' => false,
                    ],
                ],
                'gallery_entries' => [
                    [
                        'id' => $gallery->getKey(),
                        'hidden_file_path' => 'shops/gallery/new-image.jpg',
                        'sort' => 8,
                        'is_published' => false,
                    ],
                ],
                'schedule_entries' => [
                    [
                        'id' => $schedule->getKey(),
                        'weekday' => 1,
                        'time_from' => '10:00',
                        'time_to' => '19:00',
                        'sort' => 7,
                        'is_published' => false,
                    ],
                ],
            ]
        );

        $response->assertStatus(302);

        $this->assertDatabaseHas('shop', [
            'id' => $shop->getKey(),
            'code' => 'shop-edit-new',
            'title' => 'Shop Edit New',
            'sort' => 2,
        ]);
        $this->assertDatabaseHas('shop_contact', [
            'id' => $contact->getKey(),
            'shop_id' => $shop->getKey(),
            'value' => '+7 900 222 22 22',
            'sort' => 9,
            'is_published' => 0,
        ]);
        $this->assertDatabaseHas('shop_gallery_image', [
            'id' => $gallery->getKey(),
            'shop_id' => $shop->getKey(),
            'file_path' => 'shops/gallery/new-image.jpg',
            'sort' => 8,
            'is_published' => 0,
        ]);
        $this->assertDatabaseHas('shop_schedule', [
            'id' => $schedule->getKey(),
            'shop_id' => $shop->getKey(),
            'weekday' => 1,
            'time_from' => '10:00',
            'time_to' => '19:00',
            'sort' => 7,
            'is_published' => 0,
        ]);
    }

    public function test_admin_can_delete_existing_nested_shop_rows_with_empty_collections_over_http(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        Storage::fake((string) config('autoteka.media.disk', 'public'));

        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $city = City::query()->create([
            'code' => 'city-d',
            'title' => 'City D',
            'sort' => 1,
            'is_published' => true,
        ]);
        $contactType = ContactType::query()->create([
            'code' => 'phone-3',
            'title' => 'Телефон 3',
            'sort' => 1,
            'is_published' => true,
        ]);
        $shop = Shop::query()->create([
            'code' => 'shop-delete-old',
            'title' => 'Shop Delete Old',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'is_published' => true,
        ]);

        $contact = ShopContact::query()->create([
            'shop_id' => $shop->getKey(),
            'contact_type_id' => $contactType->getKey(),
            'value' => '+7 900 333 33 33',
            'sort' => 1,
            'is_published' => true,
        ]);
        $gallery = ShopGalleryImage::query()->create([
            'shop_id' => $shop->getKey(),
            'file_path' => 'shops/gallery/delete-image.jpg',
            'sort' => 1,
            'is_published' => true,
        ]);
        $schedule = ShopSchedule::query()->create([
            'shop_id' => $shop->getKey(),
            'weekday' => 1,
            'time_from' => '09:00',
            'time_to' => '18:00',
            'sort' => 1,
            'is_published' => true,
        ]);
        DB::table('shop_schedule_note')->insert([
            'shop_id' => $shop->getKey(),
            'text' => 'Старая заметка',
            'sort' => 0,
            'is_published' => 1,
        ]);

        $response = $this->post(
            route('moonshine.crud.update', [
                'resourceUri' => 'shop-resource',
                'resourceItem' => $shop->getKey(),
            ]),
            [
                '_method' => 'PATCH',
                'code' => 'shop-delete-new',
                'title' => 'Shop Delete New',
                'sort' => 2,
                'city_id' => $city->getKey(),
                'is_published' => '1',
                'contact_entries' => [],
                'gallery_entries' => [],
                'schedule_entries' => [],
                'schedule_note_text' => '',
            ]
        );

        $response->assertStatus(302);

        $this->assertDatabaseHas('shop', [
            'id' => $shop->getKey(),
            'code' => 'shop-delete-new',
            'title' => 'Shop Delete New',
            'sort' => 2,
        ]);
        $this->assertDatabaseMissing('shop_contact', [
            'id' => $contact->getKey(),
        ]);
        $this->assertDatabaseMissing('shop_gallery_image', [
            'id' => $gallery->getKey(),
        ]);
        $this->assertDatabaseMissing('shop_schedule', [
            'id' => $schedule->getKey(),
        ]);
        $this->assertDatabaseMissing('shop_schedule_note', [
            'shop_id' => $shop->getKey(),
        ]);
    }

    private function createAdminUser(): MoonshineUser
    {
        $role = MoonshineUserRole::query()->firstOrCreate(
            ['id' => MoonshineUserRole::DEFAULT_ROLE_ID],
            ['name' => 'Admin']
        );

        return MoonshineUser::query()->create([
            'moonshine_user_role_id' => $role->getKey(),
            'email' => 'admin-shop-http@example.com',
            'name' => 'Admin Shop HTTP',
            'password' => bcrypt('admin12345'),
        ]);
    }
}
