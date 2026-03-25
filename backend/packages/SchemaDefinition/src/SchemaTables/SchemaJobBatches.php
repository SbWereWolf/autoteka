<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\JobBatchesColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaJobBatches extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::JOB_BATCHES;
    }

    public function id(): string
    {
        return JobBatchesColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(JobBatchesColumns::ID);
    }

    public function name(): string
    {
        return JobBatchesColumns::NAME->value;
    }

    public function dotName(): string
    {
        return $this->union->dot(JobBatchesColumns::NAME);
    }

    public function totalJobs(): string
    {
        return JobBatchesColumns::TOTAL_JOBS->value;
    }

    public function dotTotalJobs(): string
    {
        return $this->union->dot(JobBatchesColumns::TOTAL_JOBS);
    }

    public function pendingJobs(): string
    {
        return JobBatchesColumns::PENDING_JOBS->value;
    }

    public function dotPendingJobs(): string
    {
        return $this->union->dot(JobBatchesColumns::PENDING_JOBS);
    }

    public function failedJobs(): string
    {
        return JobBatchesColumns::FAILED_JOBS->value;
    }

    public function dotFailedJobs(): string
    {
        return $this->union->dot(JobBatchesColumns::FAILED_JOBS);
    }

    public function failedJobIds(): string
    {
        return JobBatchesColumns::FAILED_JOB_IDS->value;
    }

    public function dotFailedJobIds(): string
    {
        return $this->union->dot(JobBatchesColumns::FAILED_JOB_IDS);
    }

    public function options(): string
    {
        return JobBatchesColumns::OPTIONS->value;
    }

    public function dotOptions(): string
    {
        return $this->union->dot(JobBatchesColumns::OPTIONS);
    }

    public function cancelledAt(): string
    {
        return JobBatchesColumns::CANCELLED_AT->value;
    }

    public function dotCancelledAt(): string
    {
        return $this->union->dot(JobBatchesColumns::CANCELLED_AT);
    }

    public function createdAt(): string
    {
        return JobBatchesColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(JobBatchesColumns::CREATED_AT);
    }

    public function finishedAt(): string
    {
        return JobBatchesColumns::FINISHED_AT->value;
    }

    public function dotFinishedAt(): string
    {
        return $this->union->dot(JobBatchesColumns::FINISHED_AT);
    }
}
