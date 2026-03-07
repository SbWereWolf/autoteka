<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\City;
use App\Models\ContactType;
use App\Models\Shop;
use App\Models\ShopContact;
use App\Models\ShopScheduleNote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicApiContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_city_list_returns_expected_shape(): void
    {
        City::query()->create([
            'code' => 'test-city',
            'title' => 'Тестовый город',
            'sort' => 1,
            'is_published' => true,
        ]);

        $response = $this->getJson('/api/v1/city-list');

        $response
            ->assertOk()
            ->assertJsonStructure([
                '*' => ['id', 'code', 'title', 'sort'],
            ]);

        $first = $response->json('0');
        $this->assertArrayNotHasKey('name', $first);
    }

    public function test_category_list_hides_code_and_filters_unpublished_rows(): void
    {
        Category::query()->create([
            'code' => 'visible-category',
            'title' => 'Видимая категория',
            'sort' => 1,
            'is_published' => true,
        ]);

        Category::query()->create([
            'code' => 'hidden-category',
            'title' => 'Скрытая категория',
            'sort' => 999,
            'is_published' => false,
        ]);

        $response = $this->getJson('/api/v1/category-list');

        $response
            ->assertOk()
            ->assertJsonMissing(['title' => 'Скрытая категория'])
            ->assertJsonStructure([
                '*' => ['id', 'title', 'sort'],
            ]);

        $first = $response->json('0');
        $this->assertArrayNotHasKey('code', $first);
    }

    public function test_city_and_shop_endpoints_resolve_by_code(): void
    {
        $city = City::query()->create([
            'code' => 'test-city',
            'title' => 'Тестовый город',
            'sort' => 1,
            'is_published' => true,
        ]);
        $shop = Shop::query()->create([
            'code' => 'test-shop',
            'title' => 'Тестовый магазин',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => '',
            'site_url' => '',
            'thumb_path' => null,
            'is_published' => true,
        ]);
        ShopScheduleNote::query()->create([
            'shop_id' => $shop->getKey(),
            'text' => 'Пн-Пт 9:00-18:00',
            'sort' => 1,
            'is_published' => true,
        ]);

        $this->getJson("/api/v1/city/{$city->code}")
            ->assertOk()
            ->assertJsonPath('city.code', $city->code);

        $this->getJson("/api/v1/shop/{$shop->code}")
            ->assertOk()
            ->assertJsonPath('code', $shop->code)
            ->assertJsonPath('title', $shop->title)
            ->assertJsonPath('workHours', $shop->scheduleNotes()->first()?->text ?? '');
    }

    public function test_acceptable_contact_types_returns_grouped_filtered_contacts(): void
    {
        $phoneType = ContactType::query()->create([
            'code' => 'phone',
            'title' => 'Телефон',
            'sort' => 1,
            'is_published' => true,
        ]);
        $whatsappType = ContactType::query()->create([
            'code' => 'whatsapp',
            'title' => 'WhatsApp',
            'sort' => 2,
            'is_published' => true,
        ]);
        $city = City::query()->create([
            'code' => 'test-city',
            'title' => 'Тестовый город',
            'sort' => 1,
            'is_published' => true,
        ]);
        $shop = Shop::query()->create([
            'code' => 'barnaul-04',
            'title' => 'Тестовый магазин',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => '',
            'site_url' => '',
            'thumb_path' => null,
            'is_published' => true,
        ]);
        ShopContact::query()->create([
            'shop_id' => $shop->getKey(),
            'contact_type_id' => $phoneType->getKey(),
            'value' => '+79991234567',
            'sort' => 1,
            'is_published' => true,
        ]);
        ShopContact::query()->create([
            'shop_id' => $shop->getKey(),
            'contact_type_id' => $whatsappType->getKey(),
            'value' => '+79997654321',
            'sort' => 2,
            'is_published' => true,
        ]);

        $response = $this->postJson(
            "/api/v1/shop/{$shop->code}/acceptable-contact-types",
            ['phone', 'whatsapp']
        );

        $response
            ->assertOk()
            ->assertJsonStructure([
                'phone',
                'whatsapp',
            ])
            ->assertJsonMissingPath('email')
            ->assertJsonCount(1, 'phone')
            ->assertJsonCount(1, 'whatsapp');
    }
}
