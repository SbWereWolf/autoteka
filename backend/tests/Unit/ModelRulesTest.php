<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\City;
use App\Models\Shop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModelRulesTest extends TestCase
{
    use RefreshDatabase;

    public function test_code_is_generated_from_title_when_missing(): void
    {
        $city = City::query()->create([
            'code' => '',
            'title' => 'Новый город',
            'sort' => 1000,
            'is_published' => true,
        ]);

        $this->assertNotSame('', $city->code);
        $this->assertStringStartsWith('novyi-gorod', $city->code);
    }

    public function test_site_url_is_normalized_but_blank_values_stay_blank(): void
    {
        $city = City::query()->firstOrFail();

        $shop = Shop::query()->create([
            'code' => '',
            'title' => 'Тестовый магазин',
            'sort' => 1000,
            'city_id' => $city->getKey(),
            'description' => '',
            'site_url' => 'example.com',
            'thumb_path' => null,
            'is_published' => true,
        ]);

        $this->assertSame('https://example.com', $shop->site_url);

        $shop->site_url = " \t ";
        $shop->save();

        $this->assertSame('', $shop->fresh()->site_url);
    }
}
