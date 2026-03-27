<?php

declare(strict_types=1);

namespace ShopAPI\Http\Controllers\Api;

use ShopAPI\Http\Controllers\Controller;
use ShopAPI\Models\Shop;
use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotion;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShop;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

final class ShopPromotionListController extends Controller
{
    public function __invoke(string $code): JsonResponse
    {
        $shopSchema = new SchemaShop();
        $promotionSchema = new SchemaPromotion();
        $utcDate = now('UTC')->toDateString();

        $shop = Shop::query()
            ->with([
                'promotions' => static function ($query) use ($utcDate): void {
                    $query
                        ->published()
                        ->activeOnUtcDate($utcDate)
                        ->orderedForShowcase()
                        ->with([
                            'galleryImages' => static function ($galleryQuery): void {
                                $galleryQuery
                                    ->published()
                                    ->orderedForApi();
                            },
                        ]);
                },
            ])
            ->where($shopSchema->code(), $code)
            ->where($shopSchema->isPublished(), true)
            ->firstOrFail();

        $payload = $shop->promotions
            ->map(static function ($promotion) use ($promotionSchema): array {
                return [
                    'id' => $promotion->getKey(),
                    'code' => $promotion->code,
                    'title' => $promotion->title,
                    'description' => $promotion->description,
                    'startDate' => $promotion->getAttribute($promotionSchema->startDate())?->format('Y-m-d')
                        ?? (string) $promotion->start_date,
                    'endDate' => $promotion->getAttribute($promotionSchema->endDate())?->format('Y-m-d')
                        ?? (string) $promotion->end_date,
                    'galleryImages' => $promotion->galleryImages
                        ->pluck('file_path')
                        ->map(static fn (string $path): string => Storage::disk((string) config('autoteka.media.disk'))->url($path))
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();

        return response()->json($payload);
    }
}
