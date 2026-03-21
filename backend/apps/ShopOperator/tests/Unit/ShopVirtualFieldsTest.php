<?php

declare(strict_types=1);

namespace Tests\Unit;

use ShopOperator\Models\Shop;
use PHPUnit\Framework\TestCase;

final class ShopVirtualFieldsTest extends TestCase
{
    public function test_virtual_fields_are_not_written_to_model_attributes(): void
    {
        $shop = new Shop();

        $shop->category_links = [['category_id' => 1]];
        $shop->feature_links = [['feature_id' => 2]];
        $shop->contact_entries = [['contact_type_id' => 1, 'value' => 'x']];
        $shop->gallery_entries = [['file_path' => 'shops/a.png']];
        $shop->schedule_entries = [['weekday' => 1, 'time_from' => '09:00', 'time_to' => '18:00']];
        $shop->schedule_note = 'note';

        $attributes = $shop->getAttributes();

        self::assertArrayNotHasKey('category_links', $attributes);
        self::assertArrayNotHasKey('feature_links', $attributes);
        self::assertArrayNotHasKey('contact_entries', $attributes);
        self::assertArrayNotHasKey('gallery_entries', $attributes);
        self::assertArrayNotHasKey('schedule_entries', $attributes);
        self::assertSame('note', $attributes['schedule_note']);
        self::assertArrayNotHasKey('schedule_note_text', $attributes);
    }

    public function test_virtual_fields_are_available_in_to_array_for_save_handler(): void
    {
        $shop = new Shop();

        $shop->gallery_entries = [
            [
                'file_path' => 'shops/gallery/test.jpg',
                'sort' => 1,
                'is_published' => true,
            ],
        ];

        $data = $shop->toArray();

        self::assertSame('shops/gallery/test.jpg', $data['gallery_entries'][0]['file_path']);
        self::assertSame(1, $data['gallery_entries'][0]['sort']);
        self::assertTrue($data['gallery_entries'][0]['is_published']);
    }
}
