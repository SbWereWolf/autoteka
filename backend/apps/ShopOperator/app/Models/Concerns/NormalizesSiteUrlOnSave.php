<?php

declare(strict_types=1);

namespace ShopOperator\Models\Concerns;

use ShopOperator\Support\Url\NormalizesSiteUrl;

trait NormalizesSiteUrlOnSave
{
    protected static function bootNormalizesSiteUrlOnSave(): void
    {
        static::saving(static function ($model): void {
            $model->setAttribute(
                'site_url',
                NormalizesSiteUrl::normalize($model->getAttribute('site_url')),
            );
        });
    }
}
