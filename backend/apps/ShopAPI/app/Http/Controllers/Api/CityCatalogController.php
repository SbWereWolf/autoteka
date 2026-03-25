<?php

declare(strict_types=1);

namespace ShopAPI\Http\Controllers\Api;

use ShopAPI\Http\Controllers\Controller;
use ShopAPI\Models\City;
use ShopAPI\Models\Shop;
use Autoteka\SchemaDefinition\SchemaTables\SchemaCategory;
use Autoteka\SchemaDefinition\SchemaTables\SchemaCity;
use Autoteka\SchemaDefinition\SchemaTables\SchemaFeature;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShop;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopCategory;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopFeature;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

final class CityCatalogController extends Controller
{
    public function __invoke(string $code): JsonResponse
    {
        $schCity = new SchemaCity();
        $schShop = new SchemaShop();
        $schCategory = new SchemaCategory();
        $schFeature = new SchemaFeature();
        $pivotCategory = new SchemaShopCategory();
        $pivotFeature = new SchemaShopFeature();

        $city = City::query()
            ->where($schCity->code(), $code)
            ->where($schCity->isPublished(), true)
            ->firstOrFail();

        $shops = Shop::query()
            ->with([
                'categories' => static function ($query) use ($schCategory, $pivotCategory): void {
                    $query
                        ->where($schCategory->dotIsPublished(), true)
                        ->wherePivot($pivotCategory->isPublished(), true)
                        ->select($schCategory->dotId());
                },
                'features' => static function ($query) use ($schFeature, $pivotFeature): void {
                    $query
                        ->where($schFeature->dotIsPublished(), true)
                        ->wherePivot($pivotFeature->isPublished(), true)
                        ->select($schFeature->dotId());
                },
            ])
            ->where($schShop->cityId(), $city->getKey())
            ->where($schShop->isPublished(), true)
            ->orderBy($schShop->sort())
            ->orderBy($schShop->id())
            ->get();

        return response()->json([
            'city' => [
                'id' => $city->getKey(),
                'code' => $city->code,
                'title' => $city->title,
                'sort' => $city->sort,
            ],
            'items' => $shops->map(function (Shop $shop) use ($schCategory, $schFeature): array {
                return [
                    'id' => $shop->getKey(),
                    'code' => $shop->code,
                    'title' => $shop->title,
                    'sort' => $shop->sort,
                    'cityId' => $shop->city_id,
                    'thumbUrl' => $shop->thumb_path === null ? null : Storage::disk((string) config('autoteka.media.disk'))->url($shop->thumb_path),
                    'categoryIds' => $shop->categories->pluck($schCategory->id())->values()->all(),
                    'featureIds' => $shop->features->pluck($schFeature->id())->values()->all(),
                ];
            })->values(),
        ]);
    }
}
