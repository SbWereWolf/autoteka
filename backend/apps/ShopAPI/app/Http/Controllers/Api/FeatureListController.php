<?php

declare(strict_types=1);

namespace ShopAPI\Http\Controllers\Api;

use ShopAPI\Http\Controllers\Controller;
use ShopAPI\Models\Feature;
use Autoteka\SchemaDefinition\SchemaTables\SchemaFeature;
use Illuminate\Http\JsonResponse;

final class FeatureListController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $sch = new SchemaFeature();

        $items = Feature::query()
            ->where($sch->isPublished(), true)
            ->orderBy($sch->sort())
            ->orderBy($sch->id())
            ->get([$sch->id(), $sch->title(), $sch->sort()])
            ->map(static fn (Feature $feature): array => [
                'id' => $feature->getKey(),
                'title' => $feature->title,
                'sort' => $feature->sort,
            ]);

        return response()->json($items);
    }
}
