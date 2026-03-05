<?php

declare(strict_types=1);

namespace App\Support\Database\Columns;

enum ContactTypeColumn: string
{
    case ID = 'id';
    case CODE = 'code';
    case TITLE = 'title';
    case SORT = 'sort';
    case IS_PUBLISHED = 'is_published';
    case CREATED_AT = 'created_at';
    case UPDATED_AT = 'updated_at';
}
