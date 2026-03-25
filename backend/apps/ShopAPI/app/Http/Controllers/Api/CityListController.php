<?php

declare(strict_types=1);

namespace ShopAPI\Http\Controllers\Api;

use ShopAPI\Http\Controllers\Controller;
use ShopAPI\Models\City;
use Autoteka\SchemaDefinition\SchemaTables\SchemaCity;
use Illuminate\Http\JsonResponse;

final class CityListController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $sch = new SchemaCity();

        $items = City::query()
            ->where($sch->isPublished(), true)
            ->orderBy($sch->sort())
            ->orderBy($sch->id())
            ->get([$sch->id(), $sch->code(), $sch->title(), $sch->sort()])
            ->map(static fn (City $city): array => [
                'id' => $city->getKey(),
                'code' => $city->code,
                'title' => $city->title,
                'sort' => $city->sort,
            ]);

        return response()->json($items);
    }
}
