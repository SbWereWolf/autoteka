<?php

declare(strict_types=1);

namespace ShopAPI\Support\Shop;

use Autoteka\SchemaDefinition\Enums\Columns\ContactTypeColumns;
use Autoteka\SchemaDefinition\Enums\Columns\ShopContactColumns;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;

final class ShopContactUniqueness
{
    public static function normalizeValue(mixed $value): string
    {
        return trim((string) $value);
    }

    /**
     * @param  iterable<int, array<string, mixed>>  $rows
     */
    public static function assertUnique(iterable $rows, string $errorKey = 'contact_entries'): void
    {
        $seen = [];

        foreach ($rows as $index => $row) {
            $typeKey = self::resolveTypeKey($row);
            $value = self::normalizeValue($row[ShopContactColumns::VALUE->value] ?? null);

            if ($typeKey === '' || $value === '') {
                continue;
            }

            $duplicateKey = $typeKey.'|'.mb_strtolower($value);
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
        $typeId = trim((string) Arr::get($row, ShopContactColumns::CONTACT_TYPE_ID->value, ''));
        if ($typeId !== '') {
            return $typeId;
        }

        return trim((string) Arr::get($row, 'contact_type_' . ContactTypeColumns::CODE->value, ''));
    }
}
