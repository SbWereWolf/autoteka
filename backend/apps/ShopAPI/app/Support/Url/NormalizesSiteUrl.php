<?php

declare(strict_types=1);

namespace ShopAPI\Support\Url;

final class NormalizesSiteUrl
{
    public static function normalize(?string $value): string
    {
        return trim((string) $value);
    }
}
