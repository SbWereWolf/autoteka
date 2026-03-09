<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums\Columns;

enum CacheColumns: string
{
    case KEY = 'key';
    case VALUE = 'value';
    case EXPIRATION = 'expiration';
}
