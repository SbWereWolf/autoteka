<?php

declare(strict_types=1);

namespace ShopAPI\Http\Controllers\Api;

use ShopAPI\Http\Controllers\Controller;
use ShopAPI\Models\Category;
use Autoteka\SchemaDefinition\SchemaTables\SchemaCategory;
use Illuminate\Http\JsonResponse;

final class CategoryListController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $sch = new SchemaCategory();

        $items = Category::query()
            ->where($sch->isPublished(), true)
            ->orderBy($sch->sort())
            ->orderBy($sch->id())
            ->get([$sch->id(), $sch->title(), $sch->sort()])
            ->map(static fn (Category $category): array => [
                'id' => $category->getKey(),
                'title' => $category->title,
                'sort' => $category->sort,
            ]);

        return response()->json($items);
    }
}
