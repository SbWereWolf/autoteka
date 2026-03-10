<?php

declare(strict_types=1);

namespace Tests\Feature;

use ShopOperator\Models\Category;
use ShopOperator\Models\City;
use ShopOperator\Models\ContactType;
use ShopOperator\Models\Feature;
use ShopOperator\Models\Shop;
use ShopOperator\MoonShine\Handlers\SaveShopResourceHandler;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class ResourceEditingCoverageTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_edit_all_fields_for_dictionary_resources(): void
    {
        $this->assertDictionaryResourceEditable(City::class, 'city');
        $this->assertDictionaryResourceEditable(Category::class, 'category');
        $this->assertDictionaryResourceEditable(Feature::class, 'feature');
        $this->assertDictionaryResourceEditable(ContactType::class, 'contact_type');
    }

    public function test_can_edit_all_shop_resource_fields_via_save_handler(): void
    {
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
            'title' => 'Phone',
            'sort' => 1,
            'is_published' => true,
        ]);

        $shop = Shop::query()->create([
            'code' => 'shop-test',
            'title' => 'Shop Old',
            'sort' => 1,
            'city_id' => $cityA->getKey(),
            'description' => 'Old description',
            'site_url' => 'https://old.example.com',
            'thumb_path' => null,
            'is_published' => true,
        ]);

        $handler = app(SaveShopResourceHandler::class);

        $handler($shop, [
            'code' => 'shop-updated',
            'title' => 'Shop Updated',
            'sort' => 55,
            'city_id' => $cityB->getKey(),
            'description' => 'Updated description',
            'site_url' => 'https://example.com/shop-updated',
            'thumb_path' => 'shops/thumbs/updated.webp',
            'is_published' => false,
            'category_links' => [
                ['category_id' => $category->getKey()],
            ],
            'feature_links' => [
                ['feature_id' => $feature->getKey()],
            ],
            'contact_entries' => [
                [
                    'contact_type_id' => $contactType->getKey(),
                    'value' => '+7 912 000 00 00',
                    'sort' => 7,
                    'is_published' => false,
                ],
            ],
            'gallery_entries' => [
                [
                    'file_path' => 'shops/gallery/updated-1.webp',
                    'sort' => 3,
                    'is_published' => true,
                ],
            ],
            'schedule_entries' => [
                [
                    'weekday' => 1,
                    'time_from' => '09:00',
                    'time_to' => '18:00',
                    'sort' => 4,
                    'is_published' => true,
                ],
            ],
            'schedule_note_text' => 'Без выходных',
        ]);

        $this->assertDatabaseHas('shop', [
            'id' => $shop->getKey(),
            'code' => 'shop-updated',
            'title' => 'Shop Updated',
            'sort' => 55,
            'city_id' => $cityB->getKey(),
            'description' => 'Updated description',
            'site_url' => 'https://example.com/shop-updated',
            'thumb_path' => 'shops/thumbs/updated.webp',
            'is_published' => 0,
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
            'value' => '+7 912 000 00 00',
            'sort' => 7,
            'is_published' => 0,
        ]);
        $this->assertDatabaseHas('shop_gallery_image', [
            'shop_id' => $shop->getKey(),
            'file_path' => 'shops/gallery/updated-1.webp',
            'sort' => 3,
            'is_published' => 1,
        ]);
        $this->assertDatabaseHas('shop_schedule', [
            'shop_id' => $shop->getKey(),
            'weekday' => 1,
            'time_from' => '09:00',
            'time_to' => '18:00',
            'sort' => 4,
            'is_published' => 1,
        ]);
        $this->assertDatabaseHas('shop_schedule_note', [
            'shop_id' => $shop->getKey(),
            'text' => 'Без выходных',
            'sort' => 0,
            'is_published' => 1,
        ]);
    }

    /**
     * @param class-string<City|Category|Feature|ContactType> $modelClass
     */
    private function assertDictionaryResourceEditable(string $modelClass, string $codePrefix): void
    {
        $item = $modelClass::query()->create([
            'code' => $codePrefix . '-old',
            'title' => 'Old title',
            'sort' => 1,
            'is_published' => true,
        ]);

        $item->fill([
            'code' => $codePrefix . '-new',
            'title' => 'New title',
            'sort' => 99,
            'is_published' => false,
        ]);
        $item->save();

        $this->assertDatabaseHas($item->getTable(), [
            'id' => $item->getKey(),
            'code' => $codePrefix . '-new',
            'title' => 'New title',
            'sort' => 99,
            'is_published' => 0,
        ]);
    }
}
