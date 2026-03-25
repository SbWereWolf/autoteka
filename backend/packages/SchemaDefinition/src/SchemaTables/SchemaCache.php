<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\CacheColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaCache extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::CACHE;
    }

    public function key(): string
    {
        return CacheColumns::KEY->value;
    }

    public function dotKey(): string
    {
        return $this->union->dot(CacheColumns::KEY);
    }

    public function value(): string
    {
        return CacheColumns::VALUE->value;
    }

    public function dotValue(): string
    {
        return $this->union->dot(CacheColumns::VALUE);
    }

    public function expiration(): string
    {
        return CacheColumns::EXPIRATION->value;
    }

    public function dotExpiration(): string
    {
        return $this->union->dot(CacheColumns::EXPIRATION);
    }
}
