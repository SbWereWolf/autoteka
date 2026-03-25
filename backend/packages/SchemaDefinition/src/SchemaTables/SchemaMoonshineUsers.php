<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\MoonshineUsersColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaMoonshineUsers extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::MOONSHINE_USERS;
    }

    public function id(): string
    {
        return MoonshineUsersColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(MoonshineUsersColumns::ID);
    }

    public function moonshineUserRoleId(): string
    {
        return MoonshineUsersColumns::MOONSHINE_USER_ROLE_ID->value;
    }

    public function dotMoonshineUserRoleId(): string
    {
        return $this->union->dot(MoonshineUsersColumns::MOONSHINE_USER_ROLE_ID);
    }

    public function email(): string
    {
        return MoonshineUsersColumns::EMAIL->value;
    }

    public function dotEmail(): string
    {
        return $this->union->dot(MoonshineUsersColumns::EMAIL);
    }

    public function password(): string
    {
        return MoonshineUsersColumns::PASSWORD->value;
    }

    public function dotPassword(): string
    {
        return $this->union->dot(MoonshineUsersColumns::PASSWORD);
    }

    public function name(): string
    {
        return MoonshineUsersColumns::NAME->value;
    }

    public function dotName(): string
    {
        return $this->union->dot(MoonshineUsersColumns::NAME);
    }

    public function avatar(): string
    {
        return MoonshineUsersColumns::AVATAR->value;
    }

    public function dotAvatar(): string
    {
        return $this->union->dot(MoonshineUsersColumns::AVATAR);
    }

    public function rememberToken(): string
    {
        return MoonshineUsersColumns::REMEMBER_TOKEN->value;
    }

    public function dotRememberToken(): string
    {
        return $this->union->dot(MoonshineUsersColumns::REMEMBER_TOKEN);
    }

    public function createdAt(): string
    {
        return MoonshineUsersColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(MoonshineUsersColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return MoonshineUsersColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(MoonshineUsersColumns::UPDATED_AT);
    }
}
