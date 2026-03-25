<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Pages;

use Autoteka\SchemaDefinition\SchemaTables\SchemaCategory;
use Autoteka\SchemaDefinition\SchemaTables\SchemaCity;
use Autoteka\SchemaDefinition\SchemaTables\SchemaContactType;
use Autoteka\SchemaDefinition\SchemaTables\SchemaFeature;
use MoonShine\Contracts\Core\TypeCasts\DataWrapperContract;
use MoonShine\Laravel\Pages\Crud\FormPage;

/**
 * Серверные правила для справочников (город, категория, фича, тип контакта).
 */
final class DictionaryFormPage extends FormPage
{
    protected function rules(DataWrapperContract $item): array
    {
        $uri = $this->getResource()->getUriKey();
        $s = match ($uri) {
            'city-resource' => new SchemaCity(),
            'category-resource' => new SchemaCategory(),
            'feature-resource' => new SchemaFeature(),
            'contact-type-resource' => new SchemaContactType(),
            default => null,
        };

        if ($s === null) {
            return [];
        }

        return [
            $s->title() => ['required', 'string', 'max:500'],
            $s->sort() => ['required', 'integer', 'min:0'],
            $s->isPublished() => ['required'],
        ];
    }
}
