<?php

declare(strict_types=1);

namespace ShopAPI\Http\Controllers\Api;

use ShopAPI\Http\Controllers\Controller;
use ShopAPI\Models\City;
use ShopAPI\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

final class CityCatalogController extends Controller
{
    public function __invoke(string $code): JsonResponse
    {
        $city = City::query()
            ->where('code', $code)
            ->where('is_published', true)
            ->firstOrFail();

        $shops = Shop::query()
            ->with([
                'categories' => static fn ($query) => $query
                    ->where('category.is_published', true)
                    ->select('category.id'),
                'features' => static fn ($query) => $query
                    ->where('feature.is_published', true)
                    ->select('feature.id'),
            ])
            ->where('city_id', $city->getKey())
            ->where('is_published', true)
            ->orderBy('sort')
            ->orderBy('id')
            ->get();

        return response()->json([
            'city' => [
                'id' => $city->getKey(),
                'code' => $city->code,
                'title' => $city->title,
                'sort' => $city->sort,
            ],
            'items' => $shops->map(function (Shop $shop): array {
                return [
                    'id' => $shop->getKey(),
                    'code' => $shop->code,
                    'title' => $shop->title,
                    'sort' => $shop->sort,
                    'cityId' => $shop->city_id,
                    'thumbUrl' => $shop->thumb_path === null ? null : Storage::disk((string) config('autoteka.media.disk'))->url($shop->thumb_path),
                    'categoryIds' => $shop->categories->pluck('id')->values()->all(),
                    'featureIds' => $shop->features->pluck('id')->values()->all(),
                ];
            })->values(),
        ]);
    }
}
