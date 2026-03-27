<?php

declare(strict_types=1);

namespace ShopOperator\Http\Controllers;

use Illuminate\Http\Request;
use MoonShine\Contracts\Core\DependencyInjection\CrudRequestContract;
use MoonShine\Laravel\Http\Controllers\CrudController;
use ShopOperator\MoonShine\Resources\PromotionResource;
use Symfony\Component\HttpFoundation\Response;

final class MoonShineCrudPageController
{
    public function __construct(
        private readonly CrudController $crudController,
    ) {
    }

    public function index(Request $request, CrudRequestContract $crudRequest): Response|\Illuminate\Contracts\Support\Jsonable
    {
        if ($request->wantsJson()) {
            return $this->crudController->index($request, $crudRequest);
        }

        $resource = $crudRequest->getResource();

        if ($resource === null) {
            abort(404, 'Resource not found');
        }

        $page = $resource->getIndexPage();
        $resource->setActivePage($page);

        return response((string) $page);
    }

    public function create(Request $request, CrudRequestContract $crudRequest): Response
    {
        $resource = $crudRequest->getResource();

        if ($resource === null) {
            abort(404, 'Resource not found');
        }

        if ($resource instanceof PromotionResource && ! $resource->hasValidCreateShopContext()) {
            return redirect()->to(route('moonshine.crud.index', [
                'resourceUri' => 'shop-resource',
            ]));
        }

        $page = $resource->getFormPage();
        $resource->setItem(null);
        $resource->setItemID(null);
        $resource->setActivePage($page);

        return response((string) $page);
    }

    public function show(Request $request, CrudRequestContract $crudRequest): Response|\Illuminate\Contracts\Support\Jsonable
    {
        if ($request->wantsJson()) {
            return $this->crudController->show($request, $crudRequest);
        }

        $resource = $crudRequest->getResource();

        if ($resource === null) {
            abort(404, 'Resource not found');
        }

        $page = $resource->getDetailPage();
        $resource->setItemID((int) $request->route('resourceItem'));
        $resource->setActivePage($page);

        return response((string) $page);
    }

    public function edit(Request $request, CrudRequestContract $crudRequest): Response
    {
        $resource = $crudRequest->getResource();

        if ($resource === null) {
            abort(404, 'Resource not found');
        }

        $page = $resource->getFormPage();
        $resource->setItemID((int) $request->route('resourceItem'));
        $resource->setActivePage($page);

        return response((string) $page);
    }
}
