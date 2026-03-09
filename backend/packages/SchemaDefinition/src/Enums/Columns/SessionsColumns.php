<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums\Columns;

enum SessionsColumns: string
{
    case ID = 'id';
    case USER_ID = 'user_id';
    case IP_ADDRESS = 'ip_address';
    case USER_AGENT = 'user_agent';
    case PAYLOAD = 'payload';
    case LAST_ACTIVITY = 'last_activity';
}
