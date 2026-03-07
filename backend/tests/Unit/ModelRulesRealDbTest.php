<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\City;
use App\Models\Shop;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use PHPUnit\Framework\Attributes\Group;
use Tests\TestCase;

#[Group('realdb')]
class ModelRulesRealDbTest extends TestCase
{
    use DatabaseTransactions;

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
        $city = City::query()->create([
            'code' => 'test-city-real-db',
            'title' => 'Тестовый город RealDb',
            'sort' => 99999,
            'is_published' => true,
        ]);

        $shop = Shop::query()->create([
            'code' => 'test-shop-real-db',
            'title' => 'Тестовый магазин',
            'sort' => 99999,
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
