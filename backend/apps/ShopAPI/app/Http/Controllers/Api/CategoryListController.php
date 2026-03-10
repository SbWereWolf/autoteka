<?php

declare(strict_types=1);

namespace ShopAPI\Http\Controllers\Api;

use ShopAPI\Http\Controllers\Controller;
use ShopAPI\Models\Category;
use Illuminate\Http\JsonResponse;

final class CategoryListController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $items = Category::query()
            ->where('is_published', true)
            ->orderBy('sort')
            ->orderBy('id')
            ->get(['id', 'title', 'sort'])
            ->map(static fn (Category $category): array => [
                'id' => $category->getKey(),
                'title' => $category->title,
                'sort' => $category->sort,
            ]);

        return response()->json($items);
    }
}
