<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Pages;

use Illuminate\Http\Exceptions\HttpResponseException;
use MoonShine\Contracts\Core\TypeCasts\DataWrapperContract;
use MoonShine\Laravel\Pages\Crud\FormPage;
use ShopOperator\MoonShine\Resources\PromotionResource;

final class PromotionFormPage extends FormPage
{
    protected function prepareBeforeRender(): void
    {
        parent::prepareBeforeRender();

        $resource = $this->getResource();
        if (! $resource instanceof PromotionResource || $resource->getItemID()) {
            return;
        }

        if (! $resource->hasValidCreateShopContext()) {
            throw new HttpResponseException(
                redirect(
                    route('moonshine.crud.index', [
                        'resourceUri' => 'shop-resource',
                    ]),
                ),
            );
        }
    }

    protected function rules(DataWrapperContract $item): array
    {
        return [
            'title' => ['required', 'string'],
            'description' => ['required', 'string'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'is_published' => ['required'],
        ];
    }
}
