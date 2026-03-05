<?php

declare(strict_types=1);

namespace App\MoonShine\Resources;

use App\Models\Feature;
use MoonShine\Laravel\Pages\Crud\FormPage;
use MoonShine\Laravel\Pages\Crud\IndexPage;
use MoonShine\Laravel\Resources\ModelResource;
use MoonShine\MenuManager\Attributes\Group;
use MoonShine\MenuManager\Attributes\Order;
use MoonShine\Support\Attributes\Icon;
use MoonShine\Support\Enums\Action;
use MoonShine\Support\ListOf;
use MoonShine\UI\Fields\Date;
use MoonShine\UI\Fields\ID;
use MoonShine\UI\Fields\Number;
use MoonShine\UI\Fields\Preview;
use MoonShine\UI\Fields\Switcher;
use MoonShine\UI\Fields\Text;

#[Icon('sparkles')]
#[Group('Данные', 'database')]
#[Order(30)]
class FeatureResource extends ModelResource
{
    protected string $model = Feature::class;

    protected string $column = 'title';

    protected function activeActions(): ListOf
    {
        return parent::activeActions()->except(Action::VIEW, Action::DELETE, Action::MASS_DELETE);
    }

    protected function pages(): array
    {
        return [
            IndexPage::class,
            FormPage::class,
        ];
    }

    public function getTitle(): string
    {
        return 'Фичи';
    }

    protected function search(): array
    {
        return ['id', 'code', 'title'];
    }

    protected function indexFields(): iterable
    {
        return [
            ID::make()->sortable(),
            Text::make('Code', 'code'),
            Text::make('Название', 'title')->sortable(),
            Number::make('Sort', 'sort')->sortable(),
            Switcher::make('Опубликован', 'is_published'),
            Date::make('Создан', 'created_at')->format('d.m.Y H:i'),
            Date::make('Обновлён', 'updated_at')->format('d.m.Y H:i'),
        ];
    }

    protected function formFields(): iterable
    {
        return [
            ID::make(),
            Text::make('Code', 'code')
                ->placeholder('Автогенерация из title'),
            Text::make('Название', 'title')
                ->required(),
            Number::make('Sort', 'sort')
                ->default(0)
                ->min(0)
                ->required(),
            Switcher::make('Опубликован', 'is_published')
                ->default(true),
            Preview::make('Создан', formatted: fn ($item) => $item->created_at?->format('d.m.Y H:i') ?? ''),
            Preview::make('Обновлён', formatted: fn ($item) => $item->updated_at?->format('d.m.Y H:i') ?? ''),
        ];
    }
}
