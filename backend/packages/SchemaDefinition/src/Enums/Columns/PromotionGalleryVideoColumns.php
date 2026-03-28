<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums\Columns;

enum PromotionGalleryVideoColumns: string
{
    case ID = 'id';
    case PROMOTION_ID = 'promotion_id';
    case FILE_PATH = 'file_path';
    case ORIGINAL_NAME = 'original_name';
    case POSTER_PATH = 'poster_path';
    case POSTER_ORIGINAL_NAME = 'poster_original_name';
    case MIME = 'mime';
    case SORT = 'sort';
    case IS_PUBLISHED = 'is_published';
    case CREATED_AT = 'created_at';
    case UPDATED_AT = 'updated_at';
}
