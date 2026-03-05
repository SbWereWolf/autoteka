<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feature;
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
