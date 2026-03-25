<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\PasswordResetTokensColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaPasswordResetTokens extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::PASSWORD_RESET_TOKENS;
    }

    public function email(): string
    {
        return PasswordResetTokensColumns::EMAIL->value;
    }

    public function dotEmail(): string
    {
        return $this->union->dot(PasswordResetTokensColumns::EMAIL);
    }

    public function token(): string
    {
        return PasswordResetTokensColumns::TOKEN->value;
    }

    public function dotToken(): string
    {
        return $this->union->dot(PasswordResetTokensColumns::TOKEN);
    }

    public function createdAt(): string
    {
        return PasswordResetTokensColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(PasswordResetTokensColumns::CREATED_AT);
    }
}
