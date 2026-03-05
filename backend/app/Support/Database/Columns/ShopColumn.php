<?php

declare(strict_types=1);

namespace App\Support\Database\Columns;

enum ShopColumn: string
{
    case ID = 'id';
    case CODE = 'code';
    case TITLE = 'title';
    case SORT = 'sort';
    case CITY_ID = 'city_id';
    case DESCRIPTION = 'description';
    case SITE_URL = 'site_url';
    case THUMB_PATH = 'thumb_path';
    case IS_PUBLISHED = 'is_published';
    case CREATED_AT = 'created_at';
    case UPDATED_AT = 'updated_at';
}
