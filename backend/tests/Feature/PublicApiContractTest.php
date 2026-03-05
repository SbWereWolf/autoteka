<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\City;
use App\Models\Shop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicApiContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_city_list_returns_expected_shape(): void
    {
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
        $city = City::query()->firstOrFail();
        $shop = Shop::query()->where('city_id', $city->getKey())->firstOrFail();

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
        $shop = Shop::query()->where('code', 'barnaul-04')->firstOrFail();

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
