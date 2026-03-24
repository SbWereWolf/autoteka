<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Layouts;

use ShopOperator\MoonShine\Resources\CategoryResource;
use ShopOperator\MoonShine\Resources\CityResource;
use ShopOperator\MoonShine\Resources\ContactTypeResource;
use ShopOperator\MoonShine\Resources\FeatureResource;
use ShopOperator\MoonShine\Resources\ShopResource;
use MoonShine\Laravel\Layouts\AppLayout;
use MoonShine\ColorManager\Palettes\PurplePalette;
use MoonShine\ColorManager\ColorManager;
use MoonShine\Contracts\ColorManager\ColorManagerContract;
use MoonShine\Contracts\ColorManager\PaletteContract;
use MoonShine\MenuManager\MenuGroup;
use MoonShine\MenuManager\MenuItem;

final class MoonShineLayout extends AppLayout
{
    /**
     * @var null|class-string<PaletteContract>
     */
    protected ?string $palette = PurplePalette::class;

    /**
     * 24-часовой нативный {@code input type="time"} в браузерах зависит от локали;
     * {@code lang="ru"} на корне страницы задаёт ожидаемое отображение (без AM/PM).
     */
    protected function getHeadLang(): string
    {
        return 'ru';
    }

    protected function assets(): array
    {
        return [
            ...parent::assets(),
        ];
    }

    protected function menu(): array
    {
        return [
            MenuGroup::make('Справочники', [
                MenuItem::make(CityResource::class),
                MenuItem::make(CategoryResource::class),
                MenuItem::make(FeatureResource::class),
                MenuItem::make(ContactTypeResource::class),
            ]),
            MenuGroup::make('Данные', [
                MenuItem::make(ShopResource::class),
            ]),
            ...parent::menu(),
        ];
    }

    /**
     * @param ColorManager $colorManager
     */
    protected function colors(ColorManagerContract $colorManager): void
    {
        parent::colors($colorManager);

        // $colorManager->primary('#00000');
    }
}
