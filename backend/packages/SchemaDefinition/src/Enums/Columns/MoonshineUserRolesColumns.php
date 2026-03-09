<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums\Columns;

enum MoonshineUserRolesColumns: string
{
    case ID = 'id';
    case NAME = 'name';
    case CREATED_AT = 'created_at';
    case UPDATED_AT = 'updated_at';
}
