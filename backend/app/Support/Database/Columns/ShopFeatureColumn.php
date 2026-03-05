<?php

declare(strict_types=1);

namespace App\Support\Database\Columns;

enum ShopFeatureColumn: string
{
    case ID = 'id';
    case SHOP_ID = 'shop_id';
    case FEATURE_ID = 'feature_id';
    case CREATED_AT = 'created_at';
    case UPDATED_AT = 'updated_at';
}
