<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\Enums;

enum TableName: string
{
    case USERS = 'users';
    case PASSWORD_RESET_TOKENS = 'password_reset_tokens';
    case SESSIONS = 'sessions';
    case CACHE = 'cache';
    case CACHE_LOCKS = 'cache_locks';
    case JOBS = 'jobs';
    case JOB_BATCHES = 'job_batches';
    case FAILED_JOBS = 'failed_jobs';
    case MOONSHINE_USER_ROLES = 'moonshine_user_roles';
    case MOONSHINE_USERS = 'moonshine_users';
    case NOTIFICATIONS = 'notifications';
    case CITY = 'city';
    case CATEGORY = 'category';
    case FEATURE = 'feature';
    case CONTACT_TYPE = 'contact_type';
    case SHOP = 'shop';
    case SHOP_CATEGORY = 'shop_category';
    case SHOP_FEATURE = 'shop_feature';
    case SHOP_CONTACT = 'shop_contact';
    case SHOP_GALLERY_IMAGE = 'shop_gallery_image';
    case SHOP_SCHEDULE = 'shop_schedule';
    case MIGRATIONS = 'migrations';
}
