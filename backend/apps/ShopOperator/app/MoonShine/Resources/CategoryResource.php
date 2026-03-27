<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Resources;

use ShopOperator\Models\Category;
use Autoteka\SchemaDefinition\Enums\Columns\CategoryColumns;
use Autoteka\SchemaDefinition\SchemaTables\SchemaCategory;
use ShopOperator\MoonShine\Pages\DictionaryFormPage;
use MoonShine\Laravel\Pages\Crud\IndexPage;
use MoonShine\Laravel\Resources\ModelResource;
use MoonShine\MenuManager\Attributes\Group;
use MoonShine\MenuManager\Attributes\Order;
use MoonShine\Support\Attributes\Icon;
use MoonShine\Support\Enums\Action;
use MoonShine\Support\Enums\PageType;
use MoonShine\Support\ListOf;
use ShopOperator\Support\MoonShine\SortDefault;
use ShopOperator\MoonShine\Pages\OperatorDetailPage;
use MoonShine\UI\Fields\ID;
use MoonShine\UI\Fields\Number;
use MoonShine\UI\Fields\Preview;
use MoonShine\UI\Fields\Switcher;
use MoonShine\UI\Fields\Text;

#[Icon('tag')]
#[Group('Данные', 'database')]
#[Order(20)]
class CategoryResource extends ModelResource
{
    protected string $model = Category::class;

    protected string $column = CategoryColumns::TITLE->value;

    protected ?PageType $redirectAfterSave = PageType::INDEX;

    protected function activeActions(): ListOf
    {
        return parent::activeActions()->except(Action::DELETE, Action::MASS_DELETE);
    }

    protected function pages(): array
    {
        return [
            IndexPage::class,
            DictionaryFormPage::class,
            OperatorDetailPage::class,
        ];
    }

    public function getTitle(): string
    {
        return 'Категории';
    }

    protected function search(): array
    {
        $s = new SchemaCategory();

        return [$s->id(), $s->code(), $s->title()];
    }

    protected function detailFields(): iterable
    {
        return $this->indexFields();
    }

    protected function indexFields(): iterable
    {
        $s = new SchemaCategory();

        return [
            ID::make()->sortable(),
            Preview::make('Код', formatted: fn ($item) => (string) ($item->code ?? '')),
            Text::make('Название', $s->title())->sortable(),
            Number::make('Sort', $s->sort())->sortable(),
            Switcher::make('Опубликован', $s->isPublished()),
            Preview::make('Создан', formatted: fn ($item) => $item->created_at?->format('d.m.Y H:i') ?? ''),
            Preview::make('Обновлён', formatted: fn ($item) => $item->updated_at?->format('d.m.Y H:i') ?? ''),
        ];
    }

    protected function formFields(): iterable
    {
        $s = new SchemaCategory();

        return [
            ID::make(),
            Preview::make('Код', formatted: fn ($item) => (string) ($item->code ?? '')),
            Text::make('Название', $s->title())
                ->required()
                ->placeholder('Например: Шины и диски'),
            Number::make('Sort', $s->sort())
                ->default(SortDefault::tableMaxPlusTen(Category::class, $s->sort()))
                ->min(0)
                ->required(),
            Switcher::make('Опубликован', $s->isPublished())
                ->default(true),
            Preview::make('Создан', formatted: fn ($item) => $item->created_at?->format('d.m.Y H:i') ?? ''),
            Preview::make('Обновлён', formatted: fn ($item) => $item->updated_at?->format('d.m.Y H:i') ?? ''),
        ];
    }
}
