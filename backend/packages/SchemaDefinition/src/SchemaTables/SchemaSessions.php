<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\SessionsColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaSessions extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::SESSIONS;
    }

    public function id(): string
    {
        return SessionsColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(SessionsColumns::ID);
    }

    public function userId(): string
    {
        return SessionsColumns::USER_ID->value;
    }

    public function dotUserId(): string
    {
        return $this->union->dot(SessionsColumns::USER_ID);
    }

    public function ipAddress(): string
    {
        return SessionsColumns::IP_ADDRESS->value;
    }

    public function dotIpAddress(): string
    {
        return $this->union->dot(SessionsColumns::IP_ADDRESS);
    }

    public function userAgent(): string
    {
        return SessionsColumns::USER_AGENT->value;
    }

    public function dotUserAgent(): string
    {
        return $this->union->dot(SessionsColumns::USER_AGENT);
    }

    public function payload(): string
    {
        return SessionsColumns::PAYLOAD->value;
    }

    public function dotPayload(): string
    {
        return $this->union->dot(SessionsColumns::PAYLOAD);
    }

    public function lastActivity(): string
    {
        return SessionsColumns::LAST_ACTIVITY->value;
    }

    public function dotLastActivity(): string
    {
        return $this->union->dot(SessionsColumns::LAST_ACTIVITY);
    }
}
