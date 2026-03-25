<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\CategoryColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaCategory extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::CATEGORY;
    }

    public function id(): string
    {
        return CategoryColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(CategoryColumns::ID);
    }

    public function code(): string
    {
        return CategoryColumns::CODE->value;
    }

    public function dotCode(): string
    {
        return $this->union->dot(CategoryColumns::CODE);
    }

    public function title(): string
    {
        return CategoryColumns::TITLE->value;
    }

    public function dotTitle(): string
    {
        return $this->union->dot(CategoryColumns::TITLE);
    }

    public function sort(): string
    {
        return CategoryColumns::SORT->value;
    }

    public function dotSort(): string
    {
        return $this->union->dot(CategoryColumns::SORT);
    }

    public function isPublished(): string
    {
        return CategoryColumns::IS_PUBLISHED->value;
    }

    public function dotIsPublished(): string
    {
        return $this->union->dot(CategoryColumns::IS_PUBLISHED);
    }

    public function createdAt(): string
    {
        return CategoryColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(CategoryColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return CategoryColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(CategoryColumns::UPDATED_AT);
    }
}
