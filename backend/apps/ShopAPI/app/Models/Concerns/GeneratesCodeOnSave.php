<?php

declare(strict_types=1);

namespace ShopAPI\Models\Concerns;

use ShopAPI\Support\Slug\GeneratesStableCode;

trait GeneratesCodeOnSave
{
    protected static function bootGeneratesCodeOnSave(): void
    {
        static::saving(static function ($model): void {
            GeneratesStableCode::ensure($model);
        });
    }
}
