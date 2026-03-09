<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums\Columns;

enum ShopScheduleColumns: string
{
    case ID = 'id';
    case SHOP_ID = 'shop_id';
    case WEEKDAY = 'weekday';
    case TIME_FROM = 'time_from';
    case TIME_TO = 'time_to';
    case SORT = 'sort';
    case IS_PUBLISHED = 'is_published';
    case CREATED_AT = 'created_at';
    case UPDATED_AT = 'updated_at';
}
