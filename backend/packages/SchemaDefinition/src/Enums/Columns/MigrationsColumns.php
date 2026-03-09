<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums\Columns;

enum MigrationsColumns: string
{
    case ID = 'id';
    case MIGRATION = 'migration';
    case BATCH = 'batch';
}
