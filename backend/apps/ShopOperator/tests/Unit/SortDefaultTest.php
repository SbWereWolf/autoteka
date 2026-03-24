<?php

declare(strict_types=1);

namespace Tests\Unit;

use ShopOperator\Models\City;
use ShopOperator\Models\ContactType;
use ShopOperator\Models\Shop;
use ShopOperator\Models\ShopContact;
use ShopOperator\Support\MoonShine\SortDefault;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class SortDefaultTest extends TestCase
{
    use RefreshDatabase;

    public function test_table_max_plus_ten_uses_max_sort(): void
    {
        City::query()->create([
            'code' => 'c1',
            'title' => 'C1',
            'sort' => 25,
            'is_published' => true,
        ]);

        self::assertSame(35, SortDefault::tableMaxPlusTen(City::class));
    }

    public function test_next_shop_sort_scopes_by_city(): void
    {
        $cityA = City::query()->create([
            'code' => 'a',
            'title' => 'A',
            'sort' => 1,
            'is_published' => true,
        ]);
        $cityB = City::query()->create([
            'code' => 'b',
            'title' => 'B',
            'sort' => 2,
            'is_published' => true,
        ]);

        Shop::query()->create([
            'code' => 's1',
            'title' => 'S1',
            'sort' => 5,
            'city_id' => $cityA->getKey(),
            'description' => '',
            'is_published' => true,
        ]);
        Shop::query()->create([
            'code' => 's2',
            'title' => 'S2',
            'sort' => 100,
            'city_id' => $cityB->getKey(),
            'description' => '',
            'is_published' => true,
        ]);

        self::assertSame(15, SortDefault::nextShopSort($cityA->getKey()));
        self::assertSame(110, SortDefault::nextShopSort($cityB->getKey()));
    }

    public function test_next_shop_sort_without_city_uses_global_max(): void
    {
        $city = City::query()->create([
            'code' => 'c',
            'title' => 'C',
            'sort' => 1,
            'is_published' => true,
        ]);
        Shop::query()->create([
            'code' => 's',
            'title' => 'S',
            'sort' => 42,
            'city_id' => $city->getKey(),
            'description' => '',
            'is_published' => true,
        ]);

        self::assertSame(52, SortDefault::nextShopSort(null));
    }

    public function test_for_shop_owned_filters_by_shop_id(): void
    {
        $city = City::query()->create([
            'code' => 'c',
            'title' => 'C',
            'sort' => 1,
            'is_published' => true,
        ]);
        $shop1 = Shop::query()->create([
            'code' => 's1',
            'title' => 'S1',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => '',
            'is_published' => true,
        ]);
        $shop2 = Shop::query()->create([
            'code' => 's2',
            'title' => 'S2',
            'sort' => 2,
            'city_id' => $city->getKey(),
            'description' => '',
            'is_published' => true,
        ]);

        $type = ContactType::query()->create([
            'code' => 'phone-sd',
            'title' => 'Phone',
            'sort' => 1,
            'is_published' => true,
        ]);

        ShopContact::query()->create([
            'shop_id' => $shop1->getKey(),
            'contact_type_id' => $type->getKey(),
            'value' => '+1',
            'sort' => 30,
            'is_published' => true,
        ]);
        ShopContact::query()->create([
            'shop_id' => $shop2->getKey(),
            'contact_type_id' => $type->getKey(),
            'value' => '+2',
            'sort' => 999,
            'is_published' => true,
        ]);

        self::assertSame(40, SortDefault::forShopOwned(ShopContact::class, $shop1->getKey()));
    }
}
