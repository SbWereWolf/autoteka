<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Pages;

use MoonShine\Contracts\UI\ComponentContract;
use MoonShine\Laravel\Pages\Crud\DetailPage;
use MoonShine\Support\Enums\PageType;
use MoonShine\UI\Components\ActionGroup;
use Throwable;

class OperatorDetailPage extends DetailPage
{
    protected function booted(): void
    {
        parent::booted();

        $this->alias(PageType::DETAIL->value);
    }

    /**
     * @return list<ComponentContract>
     */
    protected function topLayer(): array
    {
        return $this->getTopButtons();
    }

    /**
     * @return list<ComponentContract>
     * @throws Throwable
     */
    protected function mainLayer(): array
    {
        return [
            $this->getDetailComponent(),
        ];
    }

    /**
     * @return list<ComponentContract>
     */
    protected function getTopButtons(): array
    {
        return [
            ActionGroup::make(
                $this->getButtons(),
            )
                ->fill($this->getResource()->getCastedData())
                ->class('justify-start mb-4'),
        ];
    }
}
