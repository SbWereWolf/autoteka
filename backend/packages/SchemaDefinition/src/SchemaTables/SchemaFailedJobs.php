<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\FailedJobsColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaFailedJobs extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::FAILED_JOBS;
    }

    public function id(): string
    {
        return FailedJobsColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(FailedJobsColumns::ID);
    }

    public function uuid(): string
    {
        return FailedJobsColumns::UUID->value;
    }

    public function dotUuid(): string
    {
        return $this->union->dot(FailedJobsColumns::UUID);
    }

    public function connection(): string
    {
        return FailedJobsColumns::CONNECTION->value;
    }

    public function dotConnection(): string
    {
        return $this->union->dot(FailedJobsColumns::CONNECTION);
    }

    public function queue(): string
    {
        return FailedJobsColumns::QUEUE->value;
    }

    public function dotQueue(): string
    {
        return $this->union->dot(FailedJobsColumns::QUEUE);
    }

    public function payload(): string
    {
        return FailedJobsColumns::PAYLOAD->value;
    }

    public function dotPayload(): string
    {
        return $this->union->dot(FailedJobsColumns::PAYLOAD);
    }

    public function exception(): string
    {
        return FailedJobsColumns::EXCEPTION->value;
    }

    public function dotException(): string
    {
        return $this->union->dot(FailedJobsColumns::EXCEPTION);
    }

    public function failedAt(): string
    {
        return FailedJobsColumns::FAILED_AT->value;
    }

    public function dotFailedAt(): string
    {
        return $this->union->dot(FailedJobsColumns::FAILED_AT);
    }
}
