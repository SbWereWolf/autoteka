<?php

declare(strict_types=1);

namespace ShopOperator\Support\MoonShine;

use Illuminate\Database\Eloquent\Model;
use ShopOperator\Models\Shop;

/**
 * Дефолты для поля sort: max(column) + 10 в заданной области.
 */
final class SortDefault
{
    /**
     * @param  class-string<Model>  $modelClass
     */
    public static function tableMaxPlusTen(string $modelClass, string $column = 'sort'): int
    {
        $max = $modelClass::query()->max($column);

        return (int) ($max ?? 0) + 10;
    }

    /**
     * Следующий sort для магазина: по городу, если city_id задан; иначе по всей таблице shop.
     */
    public static function nextShopSort(?int $cityId): int
    {
        if ($cityId === null || $cityId <= 0) {
            return self::globalShopMaxPlusTen();
        }

        $max = Shop::query()->where('city_id', $cityId)->max('sort');

        return (int) ($max ?? 0) + 10;
    }

    public static function globalShopMaxPlusTen(): int
    {
        $max = Shop::query()->max('sort');

        return (int) ($max ?? 0) + 10;
    }

    /**
     * @param  class-string<Model>  $modelClass
     */
    public static function forShopOwned(string $modelClass, int $shopId, string $column = 'sort'): int
    {
        $max = $modelClass::query()
            ->where('shop_id', $shopId)
            ->max($column);

        return (int) ($max ?? 0) + 10;
    }

    /**
     * city_id из запроса (в т.ч. old() после ошибки валидации).
     */
    public static function cityIdFromRequest(): ?int
    {
        $raw = request()->old('city_id', request()->input('city_id'));
        if ($raw === null || $raw === '') {
            return null;
        }

        $id = (int) $raw;

        return $id > 0 ? $id : null;
    }
}
