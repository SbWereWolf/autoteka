<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums\Columns;

enum ShopColumns: string
{
    case ID = 'id';
    case CODE = 'code';
    case TITLE = 'title';
    case SORT = 'sort';
    case CITY_ID = 'city_id';
    case DESCRIPTION = 'description';
    case SITE_URL = 'site_url';
    case SLOGAN = 'slogan';
    case LATITUDE = 'latitude';
    case LONGITUDE = 'longitude';
    case SCHEDULE_NOTE = 'schedule_note';
    case THUMB_PATH = 'thumb_path';
    case THUMB_ORIGINAL_NAME = 'thumb_original_name';
    case IS_PUBLISHED = 'is_published';
    case CREATED_AT = 'created_at';
    case UPDATED_AT = 'updated_at';
}
