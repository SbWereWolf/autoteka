<?php

declare(strict_types=1);

namespace ShopOperator\Support\Promotion;

use ShopOperator\Models\Promotion;
use ShopOperator\Models\Shop;
use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotion;
use Illuminate\Support\Str;

final class PromotionCodeGenerator
{
    public static function generate(Promotion $promotion, Shop $shop, string $title): string
    {
        $schema = new SchemaPromotion();
        $titleSlug = Str::slug(trim($title), '-');

        if ($titleSlug === '') {
            $titleSlug = 'item';
        }

        $base = $shop->code . '-' . $titleSlug;
        $matchingCodes = $promotion->newQuery()
            ->where($schema->shopId(), $shop->getKey())
            ->where(static function ($query) use ($schema, $base): void {
                $query
                    ->where($schema->code(), $base)
                    ->orWhere($schema->code(), 'like', $base . '-%');
            });

        if ($promotion->exists) {
            $matchingCodes->whereKeyNot($promotion->getKey());
        }

        $codes = $matchingCodes
            ->pluck($schema->code())
            ->map(static fn (mixed $code): string => trim((string) $code))
            ->filter(static fn (string $code): bool => $code !== '')
            ->values();

        if (! $codes->contains($base)) {
            return $base;
        }

        $suffixes = $codes
            ->map(static function (string $code) use ($base): ?int {
                if (! str_starts_with($code, $base . '-')) {
                    return null;
                }

                $suffix = substr($code, strlen($base) + 1);

                return ctype_digit($suffix) ? (int) $suffix : null;
            })
            ->filter(static fn (?int $suffix): bool => $suffix !== null && $suffix >= 2);

        $nextSuffix = $suffixes->isEmpty()
            ? 2
            : ($suffixes->max() + 1);

        return $base . '-' . $nextSuffix;
    }
}
