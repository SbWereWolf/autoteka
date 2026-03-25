<?php

declare(strict_types=1);

namespace ShopAPI\Models\Concerns;

use ShopAPI\Support\Slug\GeneratesStableCode;

trait GeneratesCodeOnSave
{
    abstract protected static function slugTitleColumn(): string;

    abstract protected static function slugCodeColumn(): string;

    protected static function bootGeneratesCodeOnSave(): void
    {
        static::saving(static function ($model): void {
            $class = $model::class;
            GeneratesStableCode::ensure(
                $model,
                $class::slugTitleColumn(),
                $class::slugCodeColumn(),
            );
        });
    }
}
