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
            self::validateCode($model);
        });
    }

    private static function validateCode(object $model): void
    {
        $code = trim((string) $model->getAttribute('code'));
        if ($code === '') {
            return;
        }

        $pattern = (string) config('autoteka.code_validation.pattern', '/^[A-Za-z0-9_-]+$/');

        if (! preg_match($pattern, $code)) {
            throw new \InvalidArgumentException(
                sprintf(
                    'Invalid code "%s". Allowed characters: latin letters, digits, "-" and "_".',
                    $code,
                ),
            );
        }
    }
}
