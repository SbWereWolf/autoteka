<?php

declare(strict_types=1);

namespace App\Support\Database\Columns;

enum ShopScheduleNoteColumn: string
{
    case ID = 'id';
    case SHOP_ID = 'shop_id';
    case TEXT = 'text';
    case SORT = 'sort';
    case IS_PUBLISHED = 'is_published';
    case CREATED_AT = 'created_at';
    case UPDATED_AT = 'updated_at';
}
