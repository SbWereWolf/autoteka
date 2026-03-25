<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\MoonshineUserRolesColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaMoonshineUserRoles extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::MOONSHINE_USER_ROLES;
    }

    public function id(): string
    {
        return MoonshineUserRolesColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(MoonshineUserRolesColumns::ID);
    }

    public function name(): string
    {
        return MoonshineUserRolesColumns::NAME->value;
    }

    public function dotName(): string
    {
        return $this->union->dot(MoonshineUserRolesColumns::NAME);
    }

    public function createdAt(): string
    {
        return MoonshineUserRolesColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(MoonshineUserRolesColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return MoonshineUserRolesColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(MoonshineUserRolesColumns::UPDATED_AT);
    }
}
