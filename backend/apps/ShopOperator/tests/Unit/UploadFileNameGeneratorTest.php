<?php

declare(strict_types=1);

namespace Tests\Unit;

use ShopOperator\Support\Media\UploadFileNameGenerator;
use PHPUnit\Framework\TestCase;

final class UploadFileNameGeneratorTest extends TestCase
{
    public function test_generates_uuid_with_original_extension_in_lowercase(): void
    {
        $generated = UploadFileNameGenerator::generateFromName('Мой Файл.JPEG');

        self::assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.jpeg$/',
            $generated
        );
    }

    public function test_generates_plain_uuid_when_extension_is_missing(): void
    {
        $generated = UploadFileNameGenerator::generateFromName('filename-without-extension');

        self::assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/',
            $generated
        );
    }
}

