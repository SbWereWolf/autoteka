<?php

declare(strict_types=1);

namespace ShopAPI\Models\Concerns;

use Autoteka\SchemaDefinition\SchemaTables\SchemaShop;
use ShopAPI\Support\Url\NormalizesSiteUrl;

trait NormalizesSiteUrlOnSave
{
    protected static function bootNormalizesSiteUrlOnSave(): void
    {
        static::saving(static function ($model): void {
            $sch = new SchemaShop();
            $col = $sch->siteUrl();
            $model->setAttribute(
                $col,
                NormalizesSiteUrl::normalize($model->getAttribute($col)),
            );
        });
    }
}
