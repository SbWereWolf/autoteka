<?php

declare(strict_types=1);

namespace Tests\Unit;

use ShopOperator\Support\Shop\ShopContactUniqueness;
use PHPUnit\Framework\TestCase;

final class ShopContactUniquenessTest extends TestCase
{
    public function test_normalize_for_uniqueness_compare_strips_non_alphanumeric_unicode(): void
    {
        self::assertSame(
            'абв123',
            ShopContactUniqueness::normalizeForUniquenessCompare('  аб-в: (123)  '),
        );
        self::assertSame(
            '79001112233',
            ShopContactUniqueness::normalizeForUniquenessCompare('+7 (900) 111-22-33'),
        );
    }
}
