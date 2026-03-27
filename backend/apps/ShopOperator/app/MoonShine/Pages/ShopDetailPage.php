<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Pages;

use MoonShine\Contracts\UI\ActionButtonContract;
use MoonShine\Contracts\UI\ComponentContract;
use MoonShine\Laravel\TypeCasts\ModelCaster;
use MoonShine\Support\ListOf;
use MoonShine\UI\Components\ActionButton;
use MoonShine\UI\Components\FlexibleRender;
use MoonShine\UI\Components\Layout\Box;
use MoonShine\UI\Components\Layout\Column;
use MoonShine\UI\Components\Layout\Grid;
use MoonShine\UI\Components\Table\TableBuilder;
use MoonShine\UI\Fields\Date;
use MoonShine\UI\Fields\Switcher;
use MoonShine\UI\Fields\Text;
use ShopOperator\Models\Promotion;
use ShopOperator\Models\Shop;
use ShopOperator\MoonShine\Resources\PromotionResource;
use Throwable;

final class ShopDetailPage extends OperatorDetailPage
{
    /**
     * @return list<ComponentContract>
     * @throws Throwable
     */
    protected function topLayer(): array
    {
        $shop = $this->getShop();
        $formId = $this->draftPromotionFormId($shop);

        return [
            ...parent::topLayer(),
            FlexibleRender::make(
                static fn(): string => sprintf(
                    '<form id="%s" method="POST" action="%s" class="hidden">%s</form>',
                    $formId,
                    route('shop-operator.promotions.create-draft', ['shop' => $shop->getKey()]),
                    csrf_field(),
                ),
            ),
        ];
    }

    /**
     * @return list<ComponentContract>
     * @throws Throwable
     */
    protected function mainLayer(): array
    {
        return [
            ...parent::mainLayer(),
            Box::make([
                Grid::make([
                    Column::make([
                        $this->getPromotionListComponent(),
                    ])->columnSpan(12),
                ]),
            ])->setLabel('Акции магазина'),
        ];
    }

    /**
     * @return ListOf<ActionButtonContract>
     * @throws Throwable
     */
    protected function buttons(): ListOf
    {
        $shop = $this->getShop();
        $formId = $this->draftPromotionFormId($shop);

        return new ListOf(ActionButtonContract::class, [
            $this->modifyEditButton(
                $this->getResource()->getEditButton(
                    isAsync: $this->isAsync(),
                )
            ),
            ActionButton::make('Создать рекламную акцию')
                ->primary()
                ->icon('plus')
                ->customAttributes([
                    'type' => 'submit',
                    'form' => $formId,
                ])
                ->showInLine()
                ->name('shop-create-promotion-button'),
        ]);
    }

    private function getPromotionListComponent(): TableBuilder
    {
        $shop = $this->getShop();
        $today = now()->toDateString();
        $promotions = $shop->promotions()
            ->futureOrActiveForAdmin($today)
            ->orderedForAdmin()
            ->get();
        $promotionResource = app(PromotionResource::class);

        return TableBuilder::make(items: $promotions)
            ->name('shop-promotions-table')
            ->fields([
                Text::make('Название', 'title'),
                Date::make('Дата начала', 'start_date')->format('Y-m-d'),
                Date::make('Дата окончания', 'end_date')->format('Y-m-d'),
                Switcher::make('Опубликовано', 'is_published'),
            ])
            ->cast(new ModelCaster(Promotion::class))
            ->buttons([
                $promotionResource->getDetailButton(),
                $promotionResource->getEditButton(isAsync: false),
            ])
            ->withNotFound();
    }

    private function getShop(): Shop
    {
        $shop = $this->getResource()->getItem();

        if (!$shop instanceof Shop) {
            abort(404, 'Shop not found');
        }

        return $shop;
    }

    private function draftPromotionFormId(Shop $shop): string
    {
        return 'shop-create-promotion-draft-' . $shop->getKey();
    }
}
