<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\UsersColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaUsers extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::USERS;
    }

    public function id(): string
    {
        return UsersColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(UsersColumns::ID);
    }

    public function name(): string
    {
        return UsersColumns::NAME->value;
    }

    public function dotName(): string
    {
        return $this->union->dot(UsersColumns::NAME);
    }

    public function email(): string
    {
        return UsersColumns::EMAIL->value;
    }

    public function dotEmail(): string
    {
        return $this->union->dot(UsersColumns::EMAIL);
    }

    public function emailVerifiedAt(): string
    {
        return UsersColumns::EMAIL_VERIFIED_AT->value;
    }

    public function dotEmailVerifiedAt(): string
    {
        return $this->union->dot(UsersColumns::EMAIL_VERIFIED_AT);
    }

    public function password(): string
    {
        return UsersColumns::PASSWORD->value;
    }

    public function dotPassword(): string
    {
        return $this->union->dot(UsersColumns::PASSWORD);
    }

    public function rememberToken(): string
    {
        return UsersColumns::REMEMBER_TOKEN->value;
    }

    public function dotRememberToken(): string
    {
        return $this->union->dot(UsersColumns::REMEMBER_TOKEN);
    }

    public function createdAt(): string
    {
        return UsersColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(UsersColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return UsersColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(UsersColumns::UPDATED_AT);
    }
}
