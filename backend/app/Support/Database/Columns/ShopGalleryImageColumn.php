<?php

declare(strict_types=1);

namespace App\Support\Database\Columns;

enum ShopGalleryImageColumn: string
{
    case ID = 'id';
    case SHOP_ID = 'shop_id';
    case FILE_PATH = 'file_path';
    case SORT = 'sort';
    case IS_PUBLISHED = 'is_published';
    case CREATED_AT = 'created_at';
    case UPDATED_AT = 'updated_at';
}
