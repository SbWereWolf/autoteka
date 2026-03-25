<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\MigrationsColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaMigrations extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::MIGRATIONS;
    }

    public function id(): string
    {
        return MigrationsColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(MigrationsColumns::ID);
    }

    public function migration(): string
    {
        return MigrationsColumns::MIGRATION->value;
    }

    public function dotMigration(): string
    {
        return $this->union->dot(MigrationsColumns::MIGRATION);
    }

    public function batch(): string
    {
        return MigrationsColumns::BATCH->value;
    }

    public function dotBatch(): string
    {
        return $this->union->dot(MigrationsColumns::BATCH);
    }
}
