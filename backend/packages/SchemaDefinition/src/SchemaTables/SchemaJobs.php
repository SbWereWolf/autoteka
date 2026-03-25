<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\JobsColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaJobs extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::JOBS;
    }

    public function id(): string
    {
        return JobsColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(JobsColumns::ID);
    }

    public function queue(): string
    {
        return JobsColumns::QUEUE->value;
    }

    public function dotQueue(): string
    {
        return $this->union->dot(JobsColumns::QUEUE);
    }

    public function payload(): string
    {
        return JobsColumns::PAYLOAD->value;
    }

    public function dotPayload(): string
    {
        return $this->union->dot(JobsColumns::PAYLOAD);
    }

    public function attempts(): string
    {
        return JobsColumns::ATTEMPTS->value;
    }

    public function dotAttempts(): string
    {
        return $this->union->dot(JobsColumns::ATTEMPTS);
    }

    public function reservedAt(): string
    {
        return JobsColumns::RESERVED_AT->value;
    }

    public function dotReservedAt(): string
    {
        return $this->union->dot(JobsColumns::RESERVED_AT);
    }

    public function availableAt(): string
    {
        return JobsColumns::AVAILABLE_AT->value;
    }

    public function dotAvailableAt(): string
    {
        return $this->union->dot(JobsColumns::AVAILABLE_AT);
    }

    public function createdAt(): string
    {
        return JobsColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(JobsColumns::CREATED_AT);
    }
}
