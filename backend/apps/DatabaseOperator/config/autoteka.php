<?php

declare(strict_types=1);

return [
    'always_open_label' => env('AUTOTEKA_ALWAYS_OPEN_LABEL', 'КРУГЛОСУТОЧНО'),
    'media' => [
        'disk' => env('AUTOTEKA_MEDIA_DISK', 'public'),
        'shop_thumb_dir' => 'shops/thumbs',
        'shop_gallery_dir' => 'shops/gallery',
    ],
];
