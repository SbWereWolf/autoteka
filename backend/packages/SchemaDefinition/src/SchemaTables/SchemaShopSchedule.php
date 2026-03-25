<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\ShopScheduleColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaShopSchedule extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::SHOP_SCHEDULE;
    }

    public function id(): string
    {
        return ShopScheduleColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(ShopScheduleColumns::ID);
    }

    public function shopId(): string
    {
        return ShopScheduleColumns::SHOP_ID->value;
    }

    public function dotShopId(): string
    {
        return $this->union->dot(ShopScheduleColumns::SHOP_ID);
    }

    public function weekday(): string
    {
        return ShopScheduleColumns::WEEKDAY->value;
    }

    public function dotWeekday(): string
    {
        return $this->union->dot(ShopScheduleColumns::WEEKDAY);
    }

    public function timeFrom(): string
    {
        return ShopScheduleColumns::TIME_FROM->value;
    }

    public function dotTimeFrom(): string
    {
        return $this->union->dot(ShopScheduleColumns::TIME_FROM);
    }

    public function timeTo(): string
    {
        return ShopScheduleColumns::TIME_TO->value;
    }

    public function dotTimeTo(): string
    {
        return $this->union->dot(ShopScheduleColumns::TIME_TO);
    }

    public function sort(): string
    {
        return ShopScheduleColumns::SORT->value;
    }

    public function dotSort(): string
    {
        return $this->union->dot(ShopScheduleColumns::SORT);
    }

    public function isPublished(): string
    {
        return ShopScheduleColumns::IS_PUBLISHED->value;
    }

    public function dotIsPublished(): string
    {
        return $this->union->dot(ShopScheduleColumns::IS_PUBLISHED);
    }

    public function createdAt(): string
    {
        return ShopScheduleColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(ShopScheduleColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return ShopScheduleColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(ShopScheduleColumns::UPDATED_AT);
    }
}
