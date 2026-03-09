<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums\Columns;

enum MoonshineUsersColumns: string
{
    case ID = 'id';
    case MOONSHINE_USER_ROLE_ID = 'moonshine_user_role_id';
    case EMAIL = 'email';
    case PASSWORD = 'password';
    case NAME = 'name';
    case AVATAR = 'avatar';
    case REMEMBER_TOKEN = 'remember_token';
    case CREATED_AT = 'created_at';
    case UPDATED_AT = 'updated_at';
}
