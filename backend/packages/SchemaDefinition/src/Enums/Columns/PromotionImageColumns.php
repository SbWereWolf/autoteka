<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums\Columns;

enum PromotionImageColumns: string
{
    case ID = 'id';
    case PROMOTION_ID = 'promotion_id';
    case FILE_PATH = 'file_path';
    case ORIGINAL_NAME = 'original_name';
    case SORT = 'sort';
    case IS_PUBLISHED = 'is_published';
    case CREATED_AT = 'created_at';
    case UPDATED_AT = 'updated_at';
}
