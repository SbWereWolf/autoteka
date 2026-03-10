<?php

declare(strict_types=1);

namespace ShopAPI\Http\Controllers\Api;

use ShopAPI\Http\Controllers\Controller;
use ShopAPI\Models\Feature;
use Illuminate\Http\JsonResponse;

final class FeatureListController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $items = Feature::query()
            ->where('is_published', true)
            ->orderBy('sort')
            ->orderBy('id')
            ->get(['id', 'title', 'sort'])
            ->map(static fn (Feature $feature): array => [
                'id' => $feature->getKey(),
                'title' => $feature->title,
                'sort' => $feature->sort,
            ]);

        return response()->json($items);
    }
}
