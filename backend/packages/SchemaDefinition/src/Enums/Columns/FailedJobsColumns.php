<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums\Columns;

enum FailedJobsColumns: string
{
    case ID = 'id';
    case UUID = 'uuid';
    case CONNECTION = 'connection';
    case QUEUE = 'queue';
    case PAYLOAD = 'payload';
    case EXCEPTION = 'exception';
    case FAILED_AT = 'failed_at';
}
