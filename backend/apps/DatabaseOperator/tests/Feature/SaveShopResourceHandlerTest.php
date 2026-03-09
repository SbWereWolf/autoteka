<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\City;
use App\Models\ContactType;
use App\Models\Feature;
use App\Models\Shop;
use App\MoonShine\Handlers\SaveShopResourceHandler;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}

