<?php

declare(strict_types=1);

namespace App\Support\Slug;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

final class GeneratesStableCode
{
    public static function ensure(Model $model, string $titleColumn = 'title', string $codeColumn = 'code'): void
    {
        $currentCode = trim((string) $model->getAttribute($codeColumn));
        if ($currentCode !== '') {
            $model->setAttribute($codeColumn, $currentCode);

            return;
        }

        $title = trim((string) $model->getAttribute($titleColumn));
        if ($title === '') {
            return;
        }

        $base = Str::slug($title, '-');
        if ($base === '') {
            $base = 'item';
        }

        if (! self::exists($model, $codeColumn, $base)) {
            $model->setAttribute($codeColumn, $base);

            return;
        }

        for ($attempt = 0; $attempt < 3; $attempt++) {
            $candidate = $base . '-' . random_int(1111, 9999);
            if (! self::exists($model, $codeColumn, $candidate)) {
                $model->setAttribute($codeColumn, $candidate);

                return;
            }
        }

        throw new \RuntimeException(
            'Unable to generate unique code for model ' . $model::class
        );
    }

    private static function exists(Model $model, string $codeColumn, string $candidate): bool
    {
        $query = $model->newQuery()->where($codeColumn, $candidate);

        if ($model->exists) {
            $query->whereKeyNot($model->getKey());
        }

        return $query->exists();
    }
}
