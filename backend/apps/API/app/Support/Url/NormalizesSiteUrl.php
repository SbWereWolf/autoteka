<?php

declare(strict_types=1);

namespace App\Support\Url;

final class NormalizesSiteUrl
{
    public static function normalize(?string $value): string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return '';
        }

        $parsed = parse_url($value);
        if ($parsed !== false && isset($parsed['scheme']) && $parsed['scheme'] !== '') {
            return $value;
        }

        return 'https://' . ltrim($value, '/');
    }
}
