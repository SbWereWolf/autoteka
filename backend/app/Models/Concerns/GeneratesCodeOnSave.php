<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Support\Slug\GeneratesStableCode;

trait GeneratesCodeOnSave
{
    protected static function bootGeneratesCodeOnSave(): void
    {
        static::saving(static function ($model): void {
            GeneratesStableCode::ensure($model);
        });
    }
}
