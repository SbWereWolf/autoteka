<?php

declare(strict_types=1);

namespace ShopOperator\Support\Shop;

use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;

final class ShopContactUniqueness
{
    public static function normalizeValue(mixed $value): string
    {
        return trim((string) $value);
    }

    /**
     * Нормализация только для сравнения на дубликаты: буквы и цифры (Unicode), без изменения хранимого значения.
     */
    public static function normalizeForUniquenessCompare(mixed $value): string
    {
        $trimmed = trim((string) $value);
        $alnum = preg_replace('/[^\p{L}\p{N}]/u', '', $trimmed);

        return mb_strtolower($alnum ?? '');
    }

    /**
     * @param  iterable<int, array<string, mixed>>  $rows
     */
    public static function assertUnique(iterable $rows, string $errorKey = 'contact_entries'): void
    {
        $seen = [];

        foreach ($rows as $index => $row) {
            $typeKey = self::resolveTypeKey($row);
            $value = self::normalizeValue($row['value'] ?? null);

            if ($typeKey === '' || $value === '') {
                continue;
            }

            $duplicateKey = $typeKey.'|'.self::normalizeForUniquenessCompare($value);
            if (array_key_exists($duplicateKey, $seen)) {
                throw ValidationException::withMessages([
                    $errorKey => [
                        sprintf(
                            'Контакт дублируется: type=%s, value="%s" (позиции %d и %d).',
                            $typeKey,
                            $value,
                            $seen[$duplicateKey] + 1,
                            $index + 1,
                        ),
                    ],
                ]);
            }

            $seen[$duplicateKey] = $index;
        }
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private static function resolveTypeKey(array $row): string
    {
        $typeId = trim((string) Arr::get($row, 'contact_type_id', ''));
        if ($typeId !== '') {
            return $typeId;
        }

        return trim((string) Arr::get($row, 'contact_type_code', ''));
    }
}
