<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums\Columns;

enum PasswordResetTokensColumns: string
{
    case EMAIL = 'email';
    case TOKEN = 'token';
    case CREATED_AT = 'created_at';
}
