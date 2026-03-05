<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\City;
use Illuminate\Http\JsonResponse;

final class CityListController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $items = City::query()
            ->where('is_published', true)
            ->orderBy('sort')
            ->orderBy('id')
            ->get(['id', 'code', 'title', 'sort'])
            ->map(static fn (City $city): array => [
                'id' => $city->getKey(),
                'code' => $city->code,
                'title' => $city->title,
                'sort' => $city->sort,
            ]);

        return response()->json($items);
    }
}
