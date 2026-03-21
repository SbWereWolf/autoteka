<?php

declare(strict_types=1);

namespace Tests\Feature;

use ShopOperator\Models\Category;
use ShopOperator\Models\City;
use ShopOperator\Models\ContactType;
use ShopOperator\Models\Feature;
use ShopOperator\Models\Shop;
use ShopOperator\Models\ShopContact;
use ShopOperator\Models\ShopGalleryImage;
use ShopOperator\Models\ShopSchedule;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use MoonShine\Laravel\Models\MoonshineUser;
use MoonShine\Laravel\Models\MoonshineUserRole;
use Tests\TestCase;

final class AdminHttpShopCrudFullCycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_shop_full_cycle_create_publish_edit_collections_hide_and_invalid(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        Storage::fake((string) config('autoteka.media.disk', 'public'));
        $disk = Storage::disk((string) config('autoteka.media.disk', 'public'));

        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $cityA = City::query()->create([
            'code' => 'shop-city-a',
            'title' => 'Shop City A',
            'sort' => 1,
            'is_published' => true,
        ]);
        $cityB = City::query()->create([
            'code' => 'shop-city-b',
            'title' => 'Shop City B',
            'sort' => 2,
            'is_published' => true,
        ]);
        $categoryA = Category::query()->create([
            'code' => 'shop-cat-a',
            'title' => 'Shop Cat A',
            'sort' => 1,
            'is_published' => true,
        ]);
        $categoryB = Category::query()->create([
            'code' => 'shop-cat-b',
            'title' => 'Shop Cat B',
            'sort' => 2,
            'is_published' => true,
        ]);
        $featureA = Feature::query()->create([
            'code' => 'shop-feature-a',
            'title' => 'Shop Feature A',
            'sort' => 1,
            'is_published' => true,
        ]);
        $featureB = Feature::query()->create([
            'code' => 'shop-feature-b',
            'title' => 'Shop Feature B',
            'sort' => 2,
            'is_published' => true,
        ]);
        $contactTypePhone = ContactType::query()->create([
            'code' => 'phone-cycle',
            'title' => 'Phone Cycle',
            'sort' => 1,
            'is_published' => true,
        ]);
        $contactTypeEmail = ContactType::query()->create([
            'code' => 'email-cycle',
            'title' => 'Email Cycle',
            'sort' => 2,
            'is_published' => true,
        ]);

        $disk->put('shops/gallery/cycle-old.jpg', 'old');
        $disk->put('shops/gallery/cycle-new.jpg', 'new');

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'shop-resource']), [
            'code' => 'shop-cycle',
            'title' => 'Shop Cycle',
            'sort' => 10,
            'city_id' => $cityA->getKey(),
            'description' => 'Shop cycle description',
            'site_url' => 'example.com/shop-cycle',
            'slogan' => 'Слоган цикла',
            'latitude' => 55.0287,
            'longitude' => 82.9235,
            'schedule_note' => 'Old note',
            'is_published' => '0',
            'category_links' => [
                ['category_id' => $categoryA->getKey()],
            ],
            'feature_links' => [
                ['feature_id' => $featureA->getKey()],
            ],
            'contact_entries' => [
                [
                    'contact_type_id' => $contactTypePhone->getKey(),
                    'value' => '+7 900 000 00 00',
                    'sort' => 1,
                    'is_published' => true,
                ],
            ],
            'gallery_entries' => [
                [
                    'hidden_file_path' => 'shops/gallery/cycle-old.jpg',
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
            'schedule_note' => 'Old note',
        ])->assertStatus(302);

        $shop = Shop::query()->where('code', 'shop-cycle')->firstOrFail();

        $this->assertDatabaseHas('shop', ['id' => $shop->id, 'is_published' => 0]);
        $this->assertDatabaseHas('shop_category', ['shop_id' => $shop->id, 'category_id' => $categoryA->getKey()]);
        $this->assertDatabaseHas('shop_feature', ['shop_id' => $shop->id, 'feature_id' => $featureA->getKey()]);
        $this->assertDatabaseHas('shop', ['id' => $shop->id, 'schedule_note' => 'Old note']);

        $contact = ShopContact::query()->where('shop_id', $shop->id)->firstOrFail();
        $gallery = ShopGalleryImage::query()->where('shop_id', $shop->id)->firstOrFail();
        $schedule = ShopSchedule::query()->where('shop_id', $shop->id)->firstOrFail();

        $this->post(route('moonshine.crud.update', [
            'resourceUri' => 'shop-resource',
            'resourceItem' => $shop->id,
        ]), [
            '_method' => 'PATCH',
            'code' => 'shop-cycle-updated',
            'title' => 'Shop Cycle Updated',
            'sort' => 99,
            'city_id' => $cityB->getKey(),
            'description' => 'Shop cycle description updated',
            'site_url' => 'example.com/shop-cycle-updated',
            'slogan' => 'Новый слоган цикла',
            'latitude' => 55.1234,
            'longitude' => 82.5432,
            'schedule_note' => 'New note',
            'is_published' => '1',
            'category_links' => [
                ['category_id' => $categoryB->getKey()],
            ],
            'feature_links' => [
                ['feature_id' => $featureB->getKey()],
            ],
            'contact_entries' => [
                [
                    'id' => $contact->id,
                    'contact_type_id' => $contactTypeEmail->getKey(),
                    'value' => 'mail@example.com',
                    'sort' => 5,
                    'is_published' => false,
                ],
            ],
            'gallery_entries' => [
                [
                    'id' => $gallery->id,
                    'hidden_file_path' => 'shops/gallery/cycle-new.jpg',
                    'sort' => 6,
                    'is_published' => false,
                ],
            ],
            'schedule_entries' => [
                [
                    'id' => $schedule->id,
                    'weekday' => 2,
                    'time_from' => '10:00',
                    'time_to' => '19:00',
                    'sort' => 7,
                    'is_published' => false,
                ],
            ],
            'schedule_note' => 'New note',
        ])->assertStatus(302);

        $this->assertDatabaseHas('shop', [
            'id' => $shop->id,
            'code' => 'shop-cycle',
            'title' => 'Shop Cycle Updated',
            'sort' => 99,
            'city_id' => $cityB->getKey(),
            'is_published' => 1,
        ]);
        $this->assertDatabaseMissing('shop', [
            'id' => $shop->id,
            'code' => 'shop-cycle-updated',
        ]);
        $this->assertDatabaseMissing('shop_category', ['shop_id' => $shop->id, 'category_id' => $categoryA->getKey()]);
        $this->assertDatabaseHas('shop_category', ['shop_id' => $shop->id, 'category_id' => $categoryB->getKey()]);
        $this->assertDatabaseMissing('shop_feature', ['shop_id' => $shop->id, 'feature_id' => $featureA->getKey()]);
        $this->assertDatabaseHas('shop_feature', ['shop_id' => $shop->id, 'feature_id' => $featureB->getKey()]);
        $this->assertDatabaseHas('shop_contact', [
            'id' => $contact->id,
            'contact_type_id' => $contactTypeEmail->getKey(),
            'value' => 'mail@example.com',
            'sort' => 5,
            'is_published' => 0,
        ]);
        $this->assertDatabaseHas('shop_gallery_image', [
            'id' => $gallery->id,
            'sort' => 6,
            'is_published' => 0,
        ]);
        $updatedGallery = ShopGalleryImage::query()->findOrFail($gallery->id);
        self::assertStringStartsWith('shops/gallery/', $updatedGallery->file_path);
        $disk->assertMissing('shops/gallery/cycle-old.jpg');
        $this->assertDatabaseHas('shop_schedule', [
            'id' => $schedule->id,
            'weekday' => 2,
            'time_from' => '10:00',
            'time_to' => '19:00',
            'sort' => 7,
            'is_published' => 0,
        ]);
        $this->assertDatabaseHas('shop', [
            'id' => $shop->id,
            'schedule_note' => 'New note',
        ]);

        $this->post(route('moonshine.crud.update', [
            'resourceUri' => 'shop-resource',
            'resourceItem' => $shop->id,
        ]), [
            '_method' => 'PATCH',
            'code' => 'shop-cycle-updated',
            'title' => 'Shop Cycle Updated',
            'sort' => 99,
            'city_id' => $cityB->getKey(),
            'description' => 'Shop cycle description updated',
            'site_url' => 'example.com/shop-cycle-updated',
            'is_published' => '0',
            'category_links' => [],
            'feature_links' => [],
            'contact_entries' => [],
            'gallery_entries' => [],
            'schedule_entries' => [],
            'schedule_note' => '',
        ])->assertStatus(302);

        $this->assertDatabaseHas('shop', ['id' => $shop->id, 'is_published' => 0]);
        $this->assertDatabaseMissing('shop_contact', ['shop_id' => $shop->id]);
        $this->assertDatabaseMissing('shop_gallery_image', ['shop_id' => $shop->id]);
        $this->assertDatabaseMissing('shop_schedule', ['shop_id' => $shop->id]);
        $this->assertDatabaseHas('shop', ['id' => $shop->id, 'schedule_note' => null]);

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'shop-resource']), [
            'code' => 'shop-invalid-no-city',
            'title' => 'Shop Invalid',
            'sort' => 1,
            'city_id' => null,
            'description' => '',
            'site_url' => '',
            'is_published' => '1',
            'category_links' => [],
            'feature_links' => [],
            'contact_entries' => [],
            'gallery_entries' => [],
            'schedule_entries' => [],
            'schedule_note' => '',
        ])->assertStatus(302);

        $this->assertDatabaseMissing('shop', ['title' => 'Shop Invalid']);
    }

    private function createAdminUser(): MoonshineUser
    {
        $role = MoonshineUserRole::query()->firstOrCreate(
            ['id' => MoonshineUserRole::DEFAULT_ROLE_ID],
            ['name' => 'Admin'],
        );

        return MoonshineUser::query()->create([
            'moonshine_user_role_id' => $role->getKey(),
            'email' => 'admin-shop-cycle@example.com',
            'name' => 'Admin Shop Cycle',
            'password' => bcrypt('admin12345'),
        ]);
    }
}
