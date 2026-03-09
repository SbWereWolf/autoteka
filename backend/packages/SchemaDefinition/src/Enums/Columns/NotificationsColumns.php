<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums\Columns;

enum NotificationsColumns: string
{
    case ID = 'id';
    case TYPE = 'type';
    case NOTIFIABLE_TYPE = 'notifiable_type';
    case NOTIFIABLE_ID = 'notifiable_id';
    case DATA = 'data';
    case READ_AT = 'read_at';
    case CREATED_AT = 'created_at';
    case UPDATED_AT = 'updated_at';
}
