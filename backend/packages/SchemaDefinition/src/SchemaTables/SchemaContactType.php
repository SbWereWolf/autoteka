<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\ContactTypeColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaContactType extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::CONTACT_TYPE;
    }

    public function id(): string
    {
        return ContactTypeColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(ContactTypeColumns::ID);
    }

    public function code(): string
    {
        return ContactTypeColumns::CODE->value;
    }

    public function dotCode(): string
    {
        return $this->union->dot(ContactTypeColumns::CODE);
    }

    public function title(): string
    {
        return ContactTypeColumns::TITLE->value;
    }

    public function dotTitle(): string
    {
        return $this->union->dot(ContactTypeColumns::TITLE);
    }

    public function sort(): string
    {
        return ContactTypeColumns::SORT->value;
    }

    public function dotSort(): string
    {
        return $this->union->dot(ContactTypeColumns::SORT);
    }

    public function isPublished(): string
    {
        return ContactTypeColumns::IS_PUBLISHED->value;
    }

    public function dotIsPublished(): string
    {
        return $this->union->dot(ContactTypeColumns::IS_PUBLISHED);
    }

    public function createdAt(): string
    {
        return ContactTypeColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(ContactTypeColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return ContactTypeColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(ContactTypeColumns::UPDATED_AT);
    }
}
