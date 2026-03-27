<?php

declare(strict_types=1);

return [
    'always_open_label' => env('AUTOTEKA_ALWAYS_OPEN_LABEL', 'КРУГЛОСУТОЧНО'),
    'code_validation' => [
        'pattern' => env('AUTOTEKA_CODE_VALIDATION_PATTERN', '/^[A-Za-z0-9_-]+$/'),
    ],
    'media' => [
        'disk' => env('AUTOTEKA_MEDIA_DISK', 'public'),
        'shop_thumb_dir' => 'shops/thumbs',
        'shop_gallery_dir' => 'shops/gallery',
        'promotion_gallery_dir' => 'promotion/gallery',
    ],
];
