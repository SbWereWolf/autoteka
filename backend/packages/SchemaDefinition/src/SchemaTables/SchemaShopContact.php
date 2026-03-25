<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\ShopContactColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaShopContact extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::SHOP_CONTACT;
    }

    public function id(): string
    {
        return ShopContactColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(ShopContactColumns::ID);
    }

    public function shopId(): string
    {
        return ShopContactColumns::SHOP_ID->value;
    }

    public function dotShopId(): string
    {
        return $this->union->dot(ShopContactColumns::SHOP_ID);
    }

    public function contactTypeId(): string
    {
        return ShopContactColumns::CONTACT_TYPE_ID->value;
    }

    public function dotContactTypeId(): string
    {
        return $this->union->dot(ShopContactColumns::CONTACT_TYPE_ID);
    }

    public function value(): string
    {
        return ShopContactColumns::VALUE->value;
    }

    public function dotValue(): string
    {
        return $this->union->dot(ShopContactColumns::VALUE);
    }

    public function sort(): string
    {
        return ShopContactColumns::SORT->value;
    }

    public function dotSort(): string
    {
        return $this->union->dot(ShopContactColumns::SORT);
    }

    public function isPublished(): string
    {
        return ShopContactColumns::IS_PUBLISHED->value;
    }

    public function dotIsPublished(): string
    {
        return $this->union->dot(ShopContactColumns::IS_PUBLISHED);
    }

    public function createdAt(): string
    {
        return ShopContactColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(ShopContactColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return ShopContactColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(ShopContactColumns::UPDATED_AT);
    }
}
