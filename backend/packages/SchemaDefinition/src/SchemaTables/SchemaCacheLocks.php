<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\CacheLocksColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaCacheLocks extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::CACHE_LOCKS;
    }

    public function key(): string
    {
        return CacheLocksColumns::KEY->value;
    }

    public function dotKey(): string
    {
        return $this->union->dot(CacheLocksColumns::KEY);
    }

    public function owner(): string
    {
        return CacheLocksColumns::OWNER->value;
    }

    public function dotOwner(): string
    {
        return $this->union->dot(CacheLocksColumns::OWNER);
    }

    public function expiration(): string
    {
        return CacheLocksColumns::EXPIRATION->value;
    }

    public function dotExpiration(): string
    {
        return $this->union->dot(CacheLocksColumns::EXPIRATION);
    }
}
