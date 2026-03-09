<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums\Columns;

enum ShopCategoryColumns: string
{
    case ID = 'id';
    case SHOP_ID = 'shop_id';
    case CATEGORY_ID = 'category_id';
    case CREATED_AT = 'created_at';
    case UPDATED_AT = 'updated_at';
}
