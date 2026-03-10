<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Support\Media\UploadOriginalNameStore;
use Tests\TestCase;

final class UploadOriginalNameStoreTest extends TestCase
{
    public function test_register_and_pull_by_full_path(): void
    {
        $store = app(UploadOriginalNameStore::class);

        $store->register('shops/gallery/123e4567-e89b-12d3-a456-426614174000.jpg', 'orig.jpg');

        self::assertSame('orig.jpg', $store->pullByPath('shops/gallery/123e4567-e89b-12d3-a456-426614174000.jpg'));
        self::assertNull($store->pullByPath('shops/gallery/123e4567-e89b-12d3-a456-426614174000.jpg'));
    }

    public function test_pull_by_path_falls_back_to_basename_mapping(): void
    {
        $store = app(UploadOriginalNameStore::class);

        $store->register('123e4567-e89b-12d3-a456-426614174001.png', 'orig-2.png');

        self::assertSame('orig-2.png', $store->pullByPath('shops/gallery/123e4567-e89b-12d3-a456-426614174001.png'));
    }
}

