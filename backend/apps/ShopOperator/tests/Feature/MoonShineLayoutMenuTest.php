<?php

declare(strict_types=1);

namespace Tests\Feature;

use MoonShine\MenuManager\MenuGroup;
use MoonShine\MenuManager\MenuItem;
use ReflectionMethod;
use ShopOperator\MoonShine\Layouts\MoonShineLayout;
use ShopOperator\MoonShine\Resources\PromotionResource;
use Tests\TestCase;

final class MoonShineLayoutMenuTest extends TestCase
{
    public function test_data_menu_contains_promotion_resource(): void
    {
        $layout = app(MoonShineLayout::class);
        $menu = $this->invokeLayoutMethod($layout, 'menu');

        $dataGroup = collect($menu)->first(
            static fn (mixed $item): bool => $item instanceof MenuGroup
                && $item->getLabel() === 'Данные',
        );

        self::assertInstanceOf(MenuGroup::class, $dataGroup);

        $items = $dataGroup->getItems();
        $promotionItem = collect($items)->first(
            static fn (mixed $item): bool => $item instanceof MenuItem
                && $item->getLabel() === 'Рекламные акции'
                && $item->getFiller() instanceof PromotionResource,
        );

        self::assertInstanceOf(MenuItem::class, $promotionItem);
    }

    /**
     * @return mixed
     */
    private function invokeLayoutMethod(object $layout, string $method): mixed
    {
        $reflection = new ReflectionMethod($layout, $method);
        $reflection->setAccessible(true);

        return $reflection->invoke($layout);
    }
}
