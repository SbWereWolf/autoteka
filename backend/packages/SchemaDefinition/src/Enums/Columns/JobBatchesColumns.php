<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums\Columns;

enum JobBatchesColumns: string
{
    case ID = 'id';
    case NAME = 'name';
    case TOTAL_JOBS = 'total_jobs';
    case PENDING_JOBS = 'pending_jobs';
    case FAILED_JOBS = 'failed_jobs';
    case FAILED_JOB_IDS = 'failed_job_ids';
    case OPTIONS = 'options';
    case CANCELLED_AT = 'cancelled_at';
    case CREATED_AT = 'created_at';
    case FINISHED_AT = 'finished_at';
}
