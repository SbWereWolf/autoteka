<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\CityColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaCity extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::CITY;
    }

    public function id(): string
    {
        return CityColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(CityColumns::ID);
    }

    public function code(): string
    {
        return CityColumns::CODE->value;
    }

    public function dotCode(): string
    {
        return $this->union->dot(CityColumns::CODE);
    }

    public function title(): string
    {
        return CityColumns::TITLE->value;
    }

    public function dotTitle(): string
    {
        return $this->union->dot(CityColumns::TITLE);
    }

    public function sort(): string
    {
        return CityColumns::SORT->value;
    }

    public function dotSort(): string
    {
        return $this->union->dot(CityColumns::SORT);
    }

    public function isPublished(): string
    {
        return CityColumns::IS_PUBLISHED->value;
    }

    public function dotIsPublished(): string
    {
        return $this->union->dot(CityColumns::IS_PUBLISHED);
    }

    public function createdAt(): string
    {
        return CityColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(CityColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return CityColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(CityColumns::UPDATED_AT);
    }
}
