<?php

declare(strict_types=1);

namespace ShopOperator\Support\Shop;

use Illuminate\Validation\ValidationException;

/**
 * Общие проверки полей payload магазина (MoonShine / API-формы).
 */
final class ShopPayloadAssertions
{
    public static function assertNullableNumeric(mixed $value, string $field, string $message): void
    {
        if ($value === null) {
            return;
        }

        $normalized = trim((string) $value);
        if ($normalized === '') {
            return;
        }

        if (! is_numeric($normalized)) {
            throw ValidationException::withMessages([
                $field => [$message],
            ]);
        }
    }
}
