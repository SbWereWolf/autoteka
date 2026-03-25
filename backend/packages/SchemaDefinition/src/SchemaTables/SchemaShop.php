<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\ShopColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaShop extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::SHOP;
    }

    public function id(): string
    {
        return ShopColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(ShopColumns::ID);
    }

    public function code(): string
    {
        return ShopColumns::CODE->value;
    }

    public function dotCode(): string
    {
        return $this->union->dot(ShopColumns::CODE);
    }

    public function title(): string
    {
        return ShopColumns::TITLE->value;
    }

    public function dotTitle(): string
    {
        return $this->union->dot(ShopColumns::TITLE);
    }

    public function sort(): string
    {
        return ShopColumns::SORT->value;
    }

    public function dotSort(): string
    {
        return $this->union->dot(ShopColumns::SORT);
    }

    public function cityId(): string
    {
        return ShopColumns::CITY_ID->value;
    }

    public function dotCityId(): string
    {
        return $this->union->dot(ShopColumns::CITY_ID);
    }

    public function description(): string
    {
        return ShopColumns::DESCRIPTION->value;
    }

    public function dotDescription(): string
    {
        return $this->union->dot(ShopColumns::DESCRIPTION);
    }

    public function siteUrl(): string
    {
        return ShopColumns::SITE_URL->value;
    }

    public function dotSiteUrl(): string
    {
        return $this->union->dot(ShopColumns::SITE_URL);
    }

    public function slogan(): string
    {
        return ShopColumns::SLOGAN->value;
    }

    public function dotSlogan(): string
    {
        return $this->union->dot(ShopColumns::SLOGAN);
    }

    public function latitude(): string
    {
        return ShopColumns::LATITUDE->value;
    }

    public function dotLatitude(): string
    {
        return $this->union->dot(ShopColumns::LATITUDE);
    }

    public function longitude(): string
    {
        return ShopColumns::LONGITUDE->value;
    }

    public function dotLongitude(): string
    {
        return $this->union->dot(ShopColumns::LONGITUDE);
    }

    public function scheduleNote(): string
    {
        return ShopColumns::SCHEDULE_NOTE->value;
    }

    public function dotScheduleNote(): string
    {
        return $this->union->dot(ShopColumns::SCHEDULE_NOTE);
    }

    public function thumbPath(): string
    {
        return ShopColumns::THUMB_PATH->value;
    }

    public function dotThumbPath(): string
    {
        return $this->union->dot(ShopColumns::THUMB_PATH);
    }

    public function thumbOriginalName(): string
    {
        return ShopColumns::THUMB_ORIGINAL_NAME->value;
    }

    public function dotThumbOriginalName(): string
    {
        return $this->union->dot(ShopColumns::THUMB_ORIGINAL_NAME);
    }

    public function isPublished(): string
    {
        return ShopColumns::IS_PUBLISHED->value;
    }

    public function dotIsPublished(): string
    {
        return $this->union->dot(ShopColumns::IS_PUBLISHED);
    }

    public function createdAt(): string
    {
        return ShopColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(ShopColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return ShopColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(ShopColumns::UPDATED_AT);
    }
}
