<?php

declare(strict_types=1);

namespace Tests\Feature;

use ShopOperator\Models\Category;
use ShopOperator\Models\City;
use ShopOperator\Models\ContactType;
use ShopOperator\Models\Feature;
use ShopOperator\MoonShine\Resources\ShopResource;
use Illuminate\Foundation\Testing\RefreshDatabase;
use ReflectionMethod;
use Tests\TestCase;

final class ShopResourceFormDefinitionTest extends TestCase
{
    use RefreshDatabase;

    public function test_shop_resource_form_includes_new_shop_fields_and_logo_label(): void
    {
        $this->seedShopOptions();

        $resource = app(ShopResource::class);
        $fields = $this->invokeFormFields($resource);
        $indexedFields = $this->indexFieldsByColumn($fields);

        self::assertArrayHasKey('slogan', $indexedFields);
        self::assertArrayHasKey('latitude', $indexedFields);
        self::assertArrayHasKey('longitude', $indexedFields);
        self::assertArrayHasKey('schedule_note', $indexedFields);
        self::assertArrayNotHasKey('schedule_note_text', $indexedFields);
        self::assertSame('Логотип', $indexedFields['thumb_path']->getLabel());

        self::assertSame('time', $indexedFields['time_from']->getAttribute('type'));
        self::assertSame(900, (int) $indexedFields['time_from']->getAttribute('step'));
        self::assertSame('ru', $indexedFields['time_from']->getAttribute('lang'));
        self::assertSame('time', $indexedFields['time_to']->getAttribute('type'));
        self::assertSame(900, (int) $indexedFields['time_to']->getAttribute('step'));
        self::assertSame('ru', $indexedFields['time_to']->getAttribute('lang'));
    }

    /**
     * @return iterable<int, object>
     */
    private function invokeFormFields(ShopResource $resource): iterable
    {
        $method = new ReflectionMethod($resource, 'formFields');
        $method->setAccessible(true);

        return $method->invoke($resource);
    }

    /**
     * @param iterable<int, object> $fields
     * @return array<string, object>
     */
    private function indexFieldsByColumn(iterable $fields): array
    {
        $indexed = [];

        foreach ($fields as $field) {
            if (! is_object($field) || ! method_exists($field, 'getColumn')) {
                continue;
            }

            $indexed[$field->getColumn()] = $field;

            if (method_exists($field, 'getFields')) {
                foreach ($this->indexFieldsByColumn($field->getFields()) as $column => $nestedField) {
                    $indexed[$column] = $nestedField;
                }
            }
        }

        return $indexed;
    }

    private function seedShopOptions(): void
    {
        City::query()->create([
            'code' => 'city-resource-form',
            'title' => 'City Resource Form',
            'sort' => 1,
            'is_published' => true,
        ]);

        Category::query()->create([
            'code' => 'category-resource-form',
            'title' => 'Category Resource Form',
            'sort' => 1,
            'is_published' => true,
        ]);

        Feature::query()->create([
            'code' => 'feature-resource-form',
            'title' => 'Feature Resource Form',
            'sort' => 1,
            'is_published' => true,
        ]);

        ContactType::query()->create([
            'code' => 'contact-type-resource-form',
            'title' => 'Contact Type Resource Form',
            'sort' => 1,
            'is_published' => true,
        ]);
    }
}
