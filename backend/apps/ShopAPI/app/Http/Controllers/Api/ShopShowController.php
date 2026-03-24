<?php

declare(strict_types=1);

namespace ShopAPI\Http\Controllers\Api;

use ShopAPI\Http\Controllers\Controller;
use ShopAPI\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

final class ShopShowController extends Controller
{
    public function __invoke(string $code): JsonResponse
    {
        $shop = Shop::query()
            ->with([
                'categories' => static fn ($query) => $query
                    ->where('category.is_published', true)
                    ->wherePivot('is_published', true)
                    ->select('category.id'),
                'features' => static fn ($query) => $query
                    ->where('feature.is_published', true)
                    ->wherePivot('is_published', true)
                    ->select('feature.id'),
                'galleryImages' => static fn ($query) => $query
                    ->where('is_published', true)
                    ->orderBy('sort')
                    ->orderBy('id'),
                'schedules' => static fn ($query) => $query
                    ->where('is_published', true)
                    ->orderBy('sort')
                    ->orderBy('weekday'),
            ])
            ->where('code', $code)
            ->where('is_published', true)
            ->firstOrFail();

        return response()->json([
            'id' => $shop->getKey(),
            'code' => $shop->code,
            'title' => $shop->title,
            'sort' => $shop->sort,
            'cityId' => $shop->city_id,
            'description' => $shop->description,
            'siteUrl' => $shop->site_url ?? '',
            'slogan' => $shop->slogan ?? '',
            'latitude' => $shop->latitude,
            'longitude' => $shop->longitude,
            'scheduleNote' => $shop->schedule_note ?? '',
            'thumbUrl' => $shop->thumb_path === null ? null : Storage::disk((string) config('autoteka.media.disk'))->url($shop->thumb_path),
            'galleryImages' => $shop->galleryImages
                ->pluck('file_path')
                ->map(static fn (string $path): string => Storage::disk((string) config('autoteka.media.disk'))->url($path))
                ->values()
                ->all(),
            'categoryIds' => $shop->categories->pluck('id')->values()->all(),
            'featureIds' => $shop->features->pluck('id')->values()->all(),
        ]);
    }
}
