<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums\Columns;

enum JobsColumns: string
{
    case ID = 'id';
    case QUEUE = 'queue';
    case PAYLOAD = 'payload';
    case ATTEMPTS = 'attempts';
    case RESERVED_AT = 'reserved_at';
    case AVAILABLE_AT = 'available_at';
    case CREATED_AT = 'created_at';
}
