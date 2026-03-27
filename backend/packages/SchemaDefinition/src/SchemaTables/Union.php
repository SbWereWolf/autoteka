<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\TableName;
use BackedEnum;

final class Union
{
    /**
     * @var non-empty-string
     */
    private readonly string $base;

    public function __construct(TableName $table)
    {
        $this->base = $table->value;
    }

    /**
     * @return non-empty-string
     */
    public function dot(BackedEnum|string $column): string
    {
        $name = $column instanceof BackedEnum ? (string) $column->value : $column;

        return "$this->base.$name";
    }
}
