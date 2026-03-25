<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\TableName;

abstract class AbstractSchemaTable
{
    protected readonly Union $union;

    public function __construct()
    {
        $this->union = new Union(static::tableEnum());
    }

    /**
     * @return non-empty-string
     */
    public function table(): string
    {
        return static::tableEnum()->value;
    }

    abstract protected static function tableEnum(): TableName;
}
