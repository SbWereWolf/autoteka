<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums\Columns;

enum ShopContactColumns: string
{
    case ID = 'id';
    case SHOP_ID = 'shop_id';
    case CONTACT_TYPE_ID = 'contact_type_id';
    case VALUE = 'value';
    case SORT = 'sort';
    case IS_PUBLISHED = 'is_published';
    case CREATED_AT = 'created_at';
    case UPDATED_AT = 'updated_at';
}
