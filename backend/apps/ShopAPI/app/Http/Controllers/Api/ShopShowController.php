<?php

declare(strict_types=1);

namespace ShopAPI\Http\Controllers\Api;

use ShopAPI\Http\Controllers\Controller;
use ShopAPI\Models\Shop;
use Autoteka\SchemaDefinition\SchemaTables\SchemaCategory;
use Autoteka\SchemaDefinition\SchemaTables\SchemaFeature;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShop;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopCategory;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopFeature;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopGalleryImage;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

final class ShopShowController extends Controller
{
    public function __invoke(string $code): JsonResponse
    {
        $schCategory = new SchemaCategory();
        $schFeature = new SchemaFeature();
        $pivotCategory = new SchemaShopCategory();
        $pivotFeature = new SchemaShopFeature();
        $schGallery = new SchemaShopGalleryImage();
        $schSchedule = new SchemaShopSchedule();
        $schShop = new SchemaShop();

        $shop = Shop::query()
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
                'galleryImages' => static function ($query) use ($schGallery): void {
                    $query
                        ->where($schGallery->isPublished(), true)
                        ->orderBy($schGallery->sort())
                        ->orderBy($schGallery->id());
                },
                'schedules' => static function ($query) use ($schSchedule): void {
                    $query
                        ->where($schSchedule->isPublished(), true)
                        ->orderBy($schSchedule->sort())
                        ->orderBy($schSchedule->weekday());
                },
            ])
            ->where($schShop->code(), $code)
            ->where($schShop->isPublished(), true)
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
                ->pluck($schGallery->filePath())
                ->map(static fn (string $path): string => Storage::disk((string) config('autoteka.media.disk'))->url($path))
                ->values()
                ->all(),
            'categoryIds' => $shop->categories->pluck($schCategory->id())->values()->all(),
            'featureIds' => $shop->features->pluck($schFeature->id())->values()->all(),
        ]);
    }
}
