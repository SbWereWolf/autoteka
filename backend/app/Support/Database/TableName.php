<?php

declare(strict_types=1);

namespace App\Support\Database;

enum TableName: string
{
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
    case SHOP_SCHEDULE_NOTE = 'shop_schedule_note';
}
