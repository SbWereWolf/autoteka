<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Resources;

use ShopOperator\Models\City;
use MoonShine\Laravel\Pages\Crud\DetailPage;
use MoonShine\Laravel\Pages\Crud\FormPage;
use MoonShine\Laravel\Pages\Crud\IndexPage;
use MoonShine\Laravel\Resources\ModelResource;
use MoonShine\MenuManager\Attributes\Group;
use MoonShine\MenuManager\Attributes\Order;
use MoonShine\Support\Attributes\Icon;
use MoonShine\Support\Enums\Action;
use MoonShine\Support\Enums\PageType;
use MoonShine\Support\ListOf;
use ShopOperator\Support\MoonShine\SortDefault;
use MoonShine\UI\Fields\ID;
use MoonShine\UI\Fields\Number;
use MoonShine\UI\Fields\Preview;
use MoonShine\UI\Fields\Switcher;
use MoonShine\UI\Fields\Text;

#[Icon('map-pin')]
#[Group('Данные', 'database')]
#[Order(10)]
class CityResource extends ModelResource
{
    protected string $model = City::class;

    protected string $column = 'title';

    protected ?PageType $redirectAfterSave = PageType::INDEX;

    protected function activeActions(): ListOf
    {
        return parent::activeActions()->except(Action::DELETE, Action::MASS_DELETE);
    }

    protected function pages(): array
    {
        return [
            IndexPage::class,
            FormPage::class,
            DetailPage::class,
        ];
    }

    public function getTitle(): string
    {
        return 'Города';
    }

    protected function search(): array
    {
        return ['id', 'code', 'title'];
    }

    protected function detailFields(): iterable
    {
        return $this->indexFields();
    }

    protected function indexFields(): iterable
    {
        return [
            ID::make()->sortable(),
            Preview::make('Код', formatted: fn ($item) => (string) ($item->code ?? '')),
            Text::make('Название', 'title')->sortable(),
            Number::make('Sort', 'sort')->sortable(),
            Switcher::make('Опубликован', 'is_published'),
            Preview::make('Создан', formatted: fn ($item) => $item->created_at?->format('d.m.Y H:i') ?? ''),
            Preview::make('Обновлён', formatted: fn ($item) => $item->updated_at?->format('d.m.Y H:i') ?? ''),
        ];
    }

    protected function formFields(): iterable
    {
        return [
            ID::make(),
            Preview::make('Код', formatted: fn ($item) => (string) ($item->code ?? '')),
            Text::make('Название', 'title')
                ->required()
                ->placeholder('Например: Новосибирск'),
            Number::make('Sort', 'sort')
                ->default(SortDefault::tableMaxPlusTen(City::class))
                ->min(0)
                ->required(),
            Switcher::make('Опубликован', 'is_published')
                ->default(true),
            Preview::make('Создан', formatted: fn ($item) => $item->created_at?->format('d.m.Y H:i') ?? ''),
            Preview::make('Обновлён', formatted: fn ($item) => $item->updated_at?->format('d.m.Y H:i') ?? ''),
        ];
    }
}
