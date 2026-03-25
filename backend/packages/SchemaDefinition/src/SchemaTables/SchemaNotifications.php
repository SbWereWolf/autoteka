<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\NotificationsColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaNotifications extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::NOTIFICATIONS;
    }

    public function id(): string
    {
        return NotificationsColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(NotificationsColumns::ID);
    }

    public function type(): string
    {
        return NotificationsColumns::TYPE->value;
    }

    public function dotType(): string
    {
        return $this->union->dot(NotificationsColumns::TYPE);
    }

    public function notifiableType(): string
    {
        return NotificationsColumns::NOTIFIABLE_TYPE->value;
    }

    public function dotNotifiableType(): string
    {
        return $this->union->dot(NotificationsColumns::NOTIFIABLE_TYPE);
    }

    public function notifiableId(): string
    {
        return NotificationsColumns::NOTIFIABLE_ID->value;
    }

    public function dotNotifiableId(): string
    {
        return $this->union->dot(NotificationsColumns::NOTIFIABLE_ID);
    }

    public function data(): string
    {
        return NotificationsColumns::DATA->value;
    }

    public function dotData(): string
    {
        return $this->union->dot(NotificationsColumns::DATA);
    }

    public function readAt(): string
    {
        return NotificationsColumns::READ_AT->value;
    }

    public function dotReadAt(): string
    {
        return $this->union->dot(NotificationsColumns::READ_AT);
    }

    public function createdAt(): string
    {
        return NotificationsColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(NotificationsColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return NotificationsColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(NotificationsColumns::UPDATED_AT);
    }
}
