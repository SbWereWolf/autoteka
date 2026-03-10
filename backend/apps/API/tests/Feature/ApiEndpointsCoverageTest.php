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
use App\Models\ShopScheduleNote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

final class ApiEndpointsCoverageTest extends TestCase
{
    use RefreshDatabase;

    public function test_city_list_returns_only_published_sorted_items(): void
    {
        City::query()->create([
            'code' => 'city-hidden',
            'title' => 'Hidden',
            'sort' => 1,
            'is_published' => false,
        ]);
        $cityB = City::query()->create([
            'code' => 'city-b',
            'title' => 'City B',
            'sort' => 20,
            'is_published' => true,
        ]);
        $cityA = City::query()->create([
            'code' => 'city-a',
            'title' => 'City A',
            'sort' => 10,
            'is_published' => true,
        ]);

        $response = $this->getJson('/api/v1/city-list');
        $response->assertOk();
        $response->assertExactJson([
            [
                'id' => $cityA->getKey(),
                'code' => 'city-a',
                'title' => 'City A',
                'sort' => 10,
            ],
            [
                'id' => $cityB->getKey(),
                'code' => 'city-b',
                'title' => 'City B',
                'sort' => 20,
            ],
        ]);
    }

    public function test_category_and_feature_lists_exclude_unpublished_items(): void
    {
        Category::query()->create([
            'code' => 'cat-hidden',
            'title' => 'Cat Hidden',
            'sort' => 1,
            'is_published' => false,
        ]);
        $category = Category::query()->create([
            'code' => 'cat-a',
            'title' => 'Cat A',
            'sort' => 2,
            'is_published' => true,
        ]);

        Feature::query()->create([
            'code' => 'feat-hidden',
            'title' => 'Feature Hidden',
            'sort' => 1,
            'is_published' => false,
        ]);
        $feature = Feature::query()->create([
            'code' => 'feat-a',
            'title' => 'Feature A',
            'sort' => 2,
            'is_published' => true,
        ]);

        $this->getJson('/api/v1/category-list')
            ->assertOk()
            ->assertExactJson([[
                'id' => $category->getKey(),
                'title' => 'Cat A',
                'sort' => 2,
            ]]);

        $this->getJson('/api/v1/feature-list')
            ->assertOk()
            ->assertExactJson([[
                'id' => $feature->getKey(),
                'title' => 'Feature A',
                'sort' => 2,
            ]]);
    }

    public function test_city_catalog_returns_published_city_and_shops_only(): void
    {
        Storage::fake((string) config('autoteka.media.disk', 'public'));
        $data = $this->seedShopGraph();

        $response = $this->getJson('/api/v1/city/city-a');
        $response->assertOk();
        $response->assertJsonPath('city.code', 'city-a');
        $response->assertJsonCount(1, 'items');
        $response->assertJsonPath('items.0.code', 'shop-a');
        $response->assertJsonPath('items.0.categoryIds', [$data['category']->getKey()]);
        $response->assertJsonPath('items.0.featureIds', [$data['feature']->getKey()]);
    }

    public function test_city_catalog_returns_404_for_unknown_or_unpublished_city(): void
    {
        City::query()->create([
            'code' => 'city-hidden',
            'title' => 'Hidden City',
            'sort' => 1,
            'is_published' => false,
        ]);

        $this->getJson('/api/v1/city/unknown')->assertNotFound();
        $this->getJson('/api/v1/city/city-hidden')->assertNotFound();
    }

    public function test_shop_show_returns_full_payload_for_published_shop(): void
    {
        Storage::fake((string) config('autoteka.media.disk', 'public'));
        $data = $this->seedShopGraph();

        $response = $this->getJson('/api/v1/shop/shop-a');
        $response->assertOk();
        $response->assertJsonPath('code', 'shop-a');
        $response->assertJsonPath('cityId', $data['city']->getKey());
        $response->assertJsonPath('categoryIds', [$data['category']->getKey()]);
        $response->assertJsonPath('featureIds', [$data['feature']->getKey()]);
        $response->assertJsonPath('galleryImages.0', Storage::disk((string) config('autoteka.media.disk', 'public'))->url('shops/gallery/a.webp'));
        $response->assertJsonPath('thumbUrl', Storage::disk((string) config('autoteka.media.disk', 'public'))->url('shops/thumbs/a.webp'));
        $response->assertJsonPath('workHours', "Пн 09:00-18:00\nБез выходных");
    }

    public function test_shop_show_returns_404_for_unknown_or_unpublished_shop(): void
    {
        $city = City::query()->create([
            'code' => 'city-a',
            'title' => 'City A',
            'sort' => 1,
            'is_published' => true,
        ]);
        Shop::query()->create([
            'code' => 'shop-hidden',
            'title' => 'Hidden Shop',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'is_published' => false,
        ]);

        $this->getJson('/api/v1/shop/unknown')->assertNotFound();
        $this->getJson('/api/v1/shop/shop-hidden')->assertNotFound();
    }

    public function test_shop_show_returns_media_urls_with_uuid_file_names_when_media_is_stored_as_uuid(): void
    {
        Storage::fake((string) config('autoteka.media.disk', 'public'));

        $city = City::query()->create([
            'code' => 'city-uuid',
            'title' => 'City UUID',
            'sort' => 1,
            'is_published' => true,
        ]);
        $shop = Shop::query()->create([
            'code' => 'shop-uuid',
            'title' => 'Shop UUID',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'thumb_path' => 'shops/thumbs/123e4567-e89b-12d3-a456-426614174000.webp',
            'thumb_original_name' => 'thumb-original.webp',
            'is_published' => true,
        ]);
        ShopGalleryImage::query()->create([
            'shop_id' => $shop->getKey(),
            'file_path' => 'shops/gallery/123e4567-e89b-12d3-a456-426614174001.png',
            'original_name' => 'gallery-original.png',
            'sort' => 1,
            'is_published' => true,
        ]);

        $response = $this->getJson('/api/v1/shop/shop-uuid');
        $response->assertOk();

        $thumbUrl = (string) $response->json('thumbUrl');
        $galleryUrl = (string) $response->json('galleryImages.0');

        self::assertMatchesRegularExpression(
            '#/shops/thumbs/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$#',
            $thumbUrl
        );
        self::assertMatchesRegularExpression(
            '#/shops/gallery/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.png$#',
            $galleryUrl
        );
        self::assertStringNotContainsString('thumb-original.webp', $thumbUrl);
        self::assertStringNotContainsString('gallery-original.png', $galleryUrl);
    }

    public function test_acceptable_contact_types_filters_valid_and_invalid_values(): void
    {
        $data = $this->seedShopGraph();

        $response = $this->postJson(
            '/api/v1/shop/shop-a/acceptable-contact-types',
            ['phone', '', 'unknown-type', 'email', 123]
        );

        $response->assertOk();
        $response->assertExactJson([
            'phone' => ['+7 900 000 00 00'],
            'email' => ['mail@example.com'],
        ]);

        $this->postJson('/api/v1/shop/shop-a/acceptable-contact-types', [])
            ->assertOk()
            ->assertExactJson([]);

        $this->postJson('/api/v1/shop/unknown/acceptable-contact-types', ['phone'])
            ->assertNotFound();

        $this->assertNotNull($data['shop']);
    }

    public function test_acceptable_contact_types_handles_non_expected_array_shape_as_empty(): void
    {
        $this->seedShopGraph();

        $this->postJson('/api/v1/shop/shop-a/acceptable-contact-types', ['codes' => ['phone']])
            ->assertOk()
            ->assertExactJson([]);
    }

    /**
     * @return array{
     *   city: City,
     *   category: Category,
     *   feature: Feature,
     *   contactTypePhone: ContactType,
     *   contactTypeEmail: ContactType,
     *   shop: Shop
     * }
     */
    private function seedShopGraph(): array
    {
        $city = City::query()->create([
            'code' => 'city-a',
            'title' => 'City A',
            'sort' => 1,
            'is_published' => true,
        ]);
        City::query()->create([
            'code' => 'city-b',
            'title' => 'City B',
            'sort' => 2,
            'is_published' => true,
        ]);

        $category = Category::query()->create([
            'code' => 'cat-a',
            'title' => 'Cat A',
            'sort' => 1,
            'is_published' => true,
        ]);
        Feature::query()->create([
            'code' => 'feat-hidden',
            'title' => 'Feature Hidden',
            'sort' => 9,
            'is_published' => false,
        ]);
        $feature = Feature::query()->create([
            'code' => 'feat-a',
            'title' => 'Feature A',
            'sort' => 1,
            'is_published' => true,
        ]);

        $contactTypePhone = ContactType::query()->create([
            'code' => 'phone',
            'title' => 'Phone',
            'sort' => 1,
            'is_published' => true,
        ]);
        $contactTypeEmail = ContactType::query()->create([
            'code' => 'email',
            'title' => 'Email',
            'sort' => 2,
            'is_published' => true,
        ]);

        $shop = Shop::query()->create([
            'code' => 'shop-a',
            'title' => 'Shop A',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => 'Desc A',
            'site_url' => 'https://example.com/a',
            'thumb_path' => 'shops/thumbs/a.webp',
            'is_published' => true,
        ]);
        $shopHidden = Shop::query()->create([
            'code' => 'shop-hidden',
            'title' => 'Shop Hidden',
            'sort' => 2,
            'city_id' => $city->getKey(),
            'description' => 'Hidden',
            'site_url' => 'https://example.com/hidden',
            'thumb_path' => null,
            'is_published' => false,
        ]);

        $shop->categories()->sync([$category->getKey()]);
        $shop->features()->sync([$feature->getKey()]);
        $shopHidden->features()->sync([$feature->getKey()]);

        ShopContact::query()->create([
            'shop_id' => $shop->getKey(),
            'contact_type_id' => $contactTypePhone->getKey(),
            'value' => '+7 900 000 00 00',
            'sort' => 1,
            'is_published' => true,
        ]);
        ShopContact::query()->create([
            'shop_id' => $shop->getKey(),
            'contact_type_id' => $contactTypeEmail->getKey(),
            'value' => 'mail@example.com',
            'sort' => 2,
            'is_published' => true,
        ]);
        ShopContact::query()->create([
            'shop_id' => $shop->getKey(),
            'contact_type_id' => $contactTypeEmail->getKey(),
            'value' => 'hidden@example.com',
            'sort' => 3,
            'is_published' => false,
        ]);

        ShopGalleryImage::query()->create([
            'shop_id' => $shop->getKey(),
            'file_path' => 'shops/gallery/a.webp',
            'sort' => 1,
            'is_published' => true,
        ]);
        ShopGalleryImage::query()->create([
            'shop_id' => $shop->getKey(),
            'file_path' => 'shops/gallery/hidden.webp',
            'sort' => 2,
            'is_published' => false,
        ]);

        ShopSchedule::query()->create([
            'shop_id' => $shop->getKey(),
            'weekday' => 1,
            'time_from' => '09:00',
            'time_to' => '18:00',
            'sort' => 1,
            'is_published' => true,
        ]);
        ShopSchedule::query()->create([
            'shop_id' => $shop->getKey(),
            'weekday' => 2,
            'time_from' => '10:00',
            'time_to' => '19:00',
            'sort' => 2,
            'is_published' => false,
        ]);

        ShopScheduleNote::query()->create([
            'shop_id' => $shop->getKey(),
            'text' => 'Без выходных',
            'sort' => 0,
            'is_published' => true,
        ]);
        ShopScheduleNote::query()->create([
            'shop_id' => $shopHidden->getKey(),
            'text' => 'Hidden note',
            'sort' => 1,
            'is_published' => false,
        ]);

        return [
            'city' => $city,
            'category' => $category,
            'feature' => $feature,
            'contactTypePhone' => $contactTypePhone,
            'contactTypeEmail' => $contactTypeEmail,
            'shop' => $shop,
        ];
    }
}
