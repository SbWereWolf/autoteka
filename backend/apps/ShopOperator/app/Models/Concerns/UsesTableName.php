<?php

declare(strict_types=1);

namespace ShopOperator\Models\Concerns;

use Autoteka\SchemaDefinition\Enums\TableName;

trait UsesTableName
{
    abstract protected static function tableName(): TableName;

    public function getTable(): string
    {
        return static::tableName()->value;
    }
}
