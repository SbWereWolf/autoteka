<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\FeatureColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaFeature extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::FEATURE;
    }

    public function id(): string
    {
        return FeatureColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(FeatureColumns::ID);
    }

    public function code(): string
    {
        return FeatureColumns::CODE->value;
    }

    public function dotCode(): string
    {
        return $this->union->dot(FeatureColumns::CODE);
    }

    public function title(): string
    {
        return FeatureColumns::TITLE->value;
    }

    public function dotTitle(): string
    {
        return $this->union->dot(FeatureColumns::TITLE);
    }

    public function sort(): string
    {
        return FeatureColumns::SORT->value;
    }

    public function dotSort(): string
    {
        return $this->union->dot(FeatureColumns::SORT);
    }

    public function isPublished(): string
    {
        return FeatureColumns::IS_PUBLISHED->value;
    }

    public function dotIsPublished(): string
    {
        return $this->union->dot(FeatureColumns::IS_PUBLISHED);
    }

    public function createdAt(): string
    {
        return FeatureColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(FeatureColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return FeatureColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(FeatureColumns::UPDATED_AT);
    }
}
