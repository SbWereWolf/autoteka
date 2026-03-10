<?php

declare(strict_types=1);

namespace ShopOperator\Models\Concerns;

use ShopOperator\Support\Slug\GeneratesStableCode;
use Illuminate\Validation\ValidationException;

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
        $title = trim((string) $model->getAttribute('title'));
        if ($title === '') {
            throw ValidationException::withMessages([
                'title' => ['Поле "Название" обязательно для заполнения.'],
            ]);
        }

        $code = trim((string) $model->getAttribute('code'));
        if ($code === '') {
            throw ValidationException::withMessages([
                'code' => ['Поле "Код" обязательно и не может быть пустым.'],
            ]);
        }

        $pattern = (string) config('autoteka.code_validation.pattern', '/^[A-Za-z0-9_-]+$/');

        if (! preg_match($pattern, $code)) {
            throw ValidationException::withMessages([
                'code' => [
                    sprintf(
                        'Код "%s" содержит недопустимые символы. Разрешены латиница, цифры, "-" и "_".',
                        $code,
                    ),
                ],
            ]);
        }
    }
}
