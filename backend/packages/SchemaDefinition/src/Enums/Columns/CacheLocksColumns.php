<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums\Columns;

enum CacheLocksColumns: string
{
    case KEY = 'key';
    case OWNER = 'owner';
    case EXPIRATION = 'expiration';
}
