<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Support\Database\TableName;

trait UsesTableName
{
    abstract protected static function tableName(): TableName;

    public function getTable(): string
    {
        return static::tableName()->value;
    }
}
