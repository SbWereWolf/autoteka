<?php

declare(strict_types=1);

namespace ShopOperator\Support\Media;

use Illuminate\Support\Str;

final class UploadFileNameGenerator
{
    public static function generateFromName(string $originalName): string
    {
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $uuid = (string) Str::uuid();

        if ($extension === '') {
            return $uuid;
        }

        return $uuid.'.'.$extension;
    }
}

