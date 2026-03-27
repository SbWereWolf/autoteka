<?php

declare(strict_types=1);

namespace ShopOperator\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use MoonShine\Contracts\Core\DependencyInjection\CrudRequestContract;
use ShopOperator\Http\Controllers\MoonShineCrudPageController;
use ShopOperator\Models\Promotion;
use ShopOperator\MoonShine\Handlers\SavePromotionResourceHandler;
use ShopOperator\MoonShine\Resources\PromotionResource;

final class InterceptMoonShineHtmlCrudPages
{
    public function __construct(
        private readonly MoonShineCrudPageController $controller,
    ) {
    }

    public function handle(Request $request, Closure $next): mixed
    {
        if ($request->wantsJson()) {
            return $next($request);
        }

        if ($request->routeIs('moonshine.crud.index')) {
            return $this->controller->index($request, app(CrudRequestContract::class));
        }

        if ($request->routeIs('moonshine.crud.create')) {
            return $this->controller->create($request, app(CrudRequestContract::class));
        }

        if ($request->routeIs('moonshine.crud.show')) {
            return $this->controller->show($request, app(CrudRequestContract::class));
        }

        if ($request->routeIs('moonshine.crud.edit')) {
            return $this->controller->edit($request, app(CrudRequestContract::class));
        }

        if ($request->routeIs('moonshine.crud.store') && $request->route('resourceUri') === 'promotion-resource') {
            $promotion = app(SavePromotionResourceHandler::class)(new Promotion(), $request->all());

            return redirect()->to(app(PromotionResource::class)->getFormPageUrl($promotion->getKey()));
        }

        if ($request->routeIs('moonshine.crud.update') && $request->route('resourceUri') === 'promotion-resource') {
            $promotion = Promotion::query()->findOrFail((int) $request->route('resourceItem'));
            $promotion = app(SavePromotionResourceHandler::class)($promotion, $request->all());

            return redirect()->to(app(PromotionResource::class)->getDetailPageUrl($promotion->getKey()));
        }

        return $next($request);
    }
}
