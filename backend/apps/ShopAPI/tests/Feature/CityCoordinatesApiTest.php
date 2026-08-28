<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use ShopAPI\Models\City;
use Tests\TestCase;

final class CityCoordinatesApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_city_coordinates_are_returned_by_list_and_catalog_endpoints(): void
    {
        City::query()->create([
            'code' => 'barnaul',
            'title' => 'Барнаул',
            'sort' => 10,
            'latitude' => 53.347,
            'longitude' => 83.778,
            'is_published' => true,
        ]);

        $this->getJson('/api/v1/city-list')
            ->assertOk()
            ->assertJsonPath('0.code', 'barnaul')
            ->assertJsonPath('0.latitude', 53.347)
            ->assertJsonPath('0.longitude', 83.778);

        $this->getJson('/api/v1/city/barnaul')
            ->assertOk()
            ->assertJsonPath('city.code', 'barnaul')
            ->assertJsonPath('city.latitude', 53.347)
            ->assertJsonPath('city.longitude', 83.778);
    }
}
