<?php

declare(strict_types=1);

namespace ShopOperator\Models\Concerns;

use Illuminate\Validation\ValidationException;
use ShopOperator\Support\Slug\GeneratesStableCode;

trait GeneratesCodeOnSave
{
    abstract protected static function slugTitleColumn(): string;

    abstract protected static function slugCodeColumn(): string;

    protected static function bootGeneratesCodeOnSave(): void
    {
        static::saving(static function ($model): void {
            $class = $model::class;
            $titleColumn = $class::slugTitleColumn();
            $codeColumn = $class::slugCodeColumn();

            $title = trim((string) $model->getAttribute($titleColumn));
            if ($title === '') {
                throw ValidationException::withMessages([
                    $titleColumn => 'Укажите название.',
                ]);
            }

            $code = trim((string) $model->getAttribute($codeColumn));
            if ($code !== '' && ! preg_match('/^[A-Za-z0-9_-]+$/', $code)) {
                throw ValidationException::withMessages([
                    $codeColumn => 'Код может содержать только латиницу, цифры, дефис и подчёркивание.',
                ]);
            }

            GeneratesStableCode::ensure(
                $model,
                $titleColumn,
                $codeColumn,
            );
        });
    }
}
