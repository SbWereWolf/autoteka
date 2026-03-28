<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use MoonShine\Laravel\Pages\Crud\FormPage;
use MoonShine\Laravel\Pages\Crud\IndexPage;
use MoonShine\Support\Enums\Action;
use ReflectionMethod;
use ShopOperator\Models\City;
use ShopOperator\MoonShine\Pages\OperatorDetailPage;
use ShopOperator\MoonShine\Pages\ShopDetailPage;
use ShopOperator\MoonShine\Resources\PromotionResource;
use ShopOperator\MoonShine\Resources\ShopResource;
use ShopOperator\Models\Shop;
use Tests\TestCase;

final class PromotionResourceDefinitionTest extends TestCase
{
    use RefreshDatabase;

    public function test_promotion_resource_hides_create_and_delete_actions(): void
    {
        $resource = app(PromotionResource::class);
        $actions = $this->invokeResourceMethod($resource, 'activeActions');
        $actionNames = $this->normalizeActionNames($actions->toArray());

        self::assertSame('Рекламные акции', $resource->getTitle());
        self::assertContains(Action::VIEW->name, $actionNames);
        self::assertContains(Action::UPDATE->name, $actionNames);
        self::assertNotContains(Action::CREATE->name, $actionNames);
        self::assertNotContains(Action::DELETE->name, $actionNames);
        self::assertNotContains(Action::MASS_DELETE->name, $actionNames);

        $pages = $this->invokeResourceMethod($resource, 'pages');
        self::assertContains(IndexPage::class, $pages);
        self::assertContains(FormPage::class, $pages);
        self::assertNotContains(\ShopOperator\MoonShine\Pages\TopButtonsDetailPage::class, $pages);
        self::assertContains(OperatorDetailPage::class, $pages);
    }

    public function test_promotion_resource_form_exposes_read_only_shop_binding_and_gallery_fields(): void
    {
        $resource = app(PromotionResource::class);
        $fields = $this->invokeResourceMethod($resource, 'formFields');
        $indexedFields = $this->indexFieldsByLabel($fields);

        self::assertArrayHasKey('ID', $indexedFields);
        self::assertArrayHasKey('Код', $indexedFields);
        self::assertArrayHasKey('Магазин', $indexedFields);
        self::assertArrayHasKey('Название', $indexedFields);
        self::assertArrayHasKey('Описание', $indexedFields);
        self::assertArrayHasKey('Дата начала', $indexedFields);
        self::assertArrayHasKey('Дата окончания', $indexedFields);
        self::assertArrayHasKey('Опубликована', $indexedFields);
        self::assertArrayHasKey('Галерея', $indexedFields);
        self::assertArrayNotHasKey('Магазин (код)', $indexedFields);
        self::assertArrayNotHasKey('Магазин (название)', $indexedFields);
    }

    public function test_promotion_resource_form_exposes_separate_video_gallery_block(): void
    {
        $resource = app(PromotionResource::class);
        $fields = $this->invokeResourceMethod($resource, 'formFields');
        $indexedFields = $this->indexFieldsByColumn($fields);

        self::assertArrayHasKey('gallery_video_entries', $indexedFields);

        $videoFields = $this->indexFieldsByColumn(
            method_exists($indexedFields['gallery_video_entries'], 'getFields')
                ? $indexedFields['gallery_video_entries']->getFields()
                : [],
        );

        self::assertArrayHasKey('file_path', $videoFields);
        self::assertArrayHasKey('poster_path', $videoFields);
        self::assertArrayHasKey('poster_original_name', $videoFields);
        self::assertArrayHasKey('mime', $videoFields);
        self::assertArrayHasKey('sort', $videoFields);
        self::assertArrayHasKey('is_published', $videoFields);

        $videoFieldLabels = $this->indexFieldsByLabel(
            method_exists($indexedFields['gallery_video_entries'], 'getFields')
                ? $indexedFields['gallery_video_entries']->getFields()
                : [],
        );

        self::assertArrayHasKey('Видеофайл', $videoFieldLabels);
        self::assertArrayHasKey('Poster', $videoFieldLabels);
        self::assertArrayHasKey('Sort', $videoFieldLabels);
        self::assertArrayHasKey('Опубликован', $videoFieldLabels);
    }

    public function test_shop_detail_fields_no_longer_expose_promotion_preview_blocks(): void
    {
        $resource = app(ShopResource::class);
        $fields = $this->invokeResourceMethod($resource, 'detailFields');
        $labels = $this->extractFieldLabels($fields);

        self::assertFalse(
            collect($labels)->contains(
                static fn (string $label): bool => str_contains($label, 'Создание рекламной акции'),
            ),
            'Shop detail fields must no longer expose a preview-based promotion create block.',
        );

        self::assertFalse(
            collect($labels)->contains(
                static fn (string $label): bool => str_contains($label, 'Акции магазина'),
            ),
            'Shop detail fields must no longer expose a preview-based promotion table block.',
        );
    }

    public function test_shop_resource_uses_custom_detail_page_instead_of_preview_blocks(): void
    {
        $resource = app(ShopResource::class);
        $pages = $this->invokeResourceMethod($resource, 'pages');

        self::assertContains(ShopDetailPage::class, $pages);
        self::assertNotContains(\ShopOperator\MoonShine\Pages\TopButtonsDetailPage::class, $pages);
    }

    public function test_promotion_resource_renders_shop_link_before_city_and_shop_title(): void
    {
        $resource = app(PromotionResource::class);
        $shop = new Shop([
            'title' => 'Тестовый магазин',
        ]);
        $shop->id = 77;
        $shop->setRelation('city', new City([
            'title' => 'Екатеринбург',
        ]));

        $html = $this->invokeResourceMethod($resource, 'shopReferenceHtml', null, $shop);

        self::assertStringContainsString('Перейти в магазин', $html);
        self::assertStringNotContainsString('Открыть магазин', $html);
        self::assertMatchesRegularExpression(
            '/Перейти в магазин.*Екатеринбург: Тестовый магазин/s',
            $html,
        );
    }

    /**
     * @return array<int, string>
     */
    private function extractFieldLabels(iterable $fields): array
    {
        $labels = [];

        foreach ($fields as $field) {
            if (! is_object($field) || ! method_exists($field, 'getLabel')) {
                continue;
            }

            $labels[] = (string) $field->getLabel();

            if (method_exists($field, 'getFields')) {
                $labels = array_merge($labels, $this->extractFieldLabels($field->getFields()));
            }
        }

        return $labels;
    }

    /**
     * @param  iterable<int, object>  $fields
     * @return array<string, object>
     */
    private function indexFieldsByLabel(iterable $fields): array
    {
        $indexed = [];

        foreach ($fields as $field) {
            if (! is_object($field) || ! method_exists($field, 'getLabel')) {
                continue;
            }

            $indexed[(string) $field->getLabel()] = $field;

            if (method_exists($field, 'getFields')) {
                foreach ($this->indexFieldsByLabel($field->getFields()) as $label => $nestedField) {
                    $indexed[$label] = $nestedField;
                }
            }
        }

        return $indexed;
    }

    /**
     * @param  iterable<int, object>  $fields
     * @return array<string, object>
     */
    private function indexFieldsByColumn(iterable $fields): array
    {
        $indexed = [];

        foreach ($fields as $field) {
            if (! is_object($field) || ! method_exists($field, 'getColumn')) {
                continue;
            }

            $indexed[(string) $field->getColumn()] = $field;

            if (method_exists($field, 'getFields')) {
                foreach ($this->indexFieldsByColumn($field->getFields()) as $column => $nestedField) {
                    $indexed[$column] = $nestedField;
                }
            }
        }

        return $indexed;
    }

    /**
     * @return array<int, string>
     */
    private function normalizeActionNames(array $actions): array
    {
        return array_map(
            static fn (mixed $action): string => $action instanceof \UnitEnum
                ? $action->name
                : (string) $action,
            $actions,
        );
    }

    /**
     * @return mixed
     */
    private function invokeResourceMethod(object $resource, string $method, mixed ...$args): mixed
    {
        $reflection = new ReflectionMethod($resource, $method);
        $reflection->setAccessible(true);

        return $reflection->invoke($resource, ...$args);
    }
}
