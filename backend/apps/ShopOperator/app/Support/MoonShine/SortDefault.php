<?php

declare(strict_types=1);

namespace ShopOperator\Support\MoonShine;

use Autoteka\SchemaDefinition\SchemaTables\SchemaShop;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopContact;
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
    public static function tableMaxPlusTen(string $modelClass, string $column): int
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

        $sch = new SchemaShop();
        $max = Shop::query()->where($sch->cityId(), $cityId)->max($sch->sort());

        return (int) ($max ?? 0) + 10;
    }

    public static function globalShopMaxPlusTen(): int
    {
        $sch = new SchemaShop();
        $max = Shop::query()->max($sch->sort());

        return (int) ($max ?? 0) + 10;
    }

    /**
     * @param  class-string<Model>  $modelClass
     */
    public static function forShopOwned(string $modelClass, int $shopId, string $sortColumn): int
    {
        $shopFk = (new SchemaShopContact())->shopId();
        $max = $modelClass::query()
            ->where($shopFk, $shopId)
            ->max($sortColumn);

        return (int) ($max ?? 0) + 10;
    }

    /**
     * city_id из запроса (в т.ч. old() после ошибки валидации).
     */
    public static function cityIdFromRequest(): ?int
    {
        $sch = new SchemaShop();
        $col = $sch->cityId();
        $raw = request()->old($col, request()->input($col));
        if ($raw === null || $raw === '') {
            return null;
        }

        $id = (int) $raw;

        return $id > 0 ? $id : null;
    }
}
