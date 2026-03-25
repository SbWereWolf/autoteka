<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\ShopCategoryColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaShopCategory extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::SHOP_CATEGORY;
    }

    public function id(): string
    {
        return ShopCategoryColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(ShopCategoryColumns::ID);
    }

    public function shopId(): string
    {
        return ShopCategoryColumns::SHOP_ID->value;
    }

    public function dotShopId(): string
    {
        return $this->union->dot(ShopCategoryColumns::SHOP_ID);
    }

    public function categoryId(): string
    {
        return ShopCategoryColumns::CATEGORY_ID->value;
    }

    public function dotCategoryId(): string
    {
        return $this->union->dot(ShopCategoryColumns::CATEGORY_ID);
    }

    public function isPublished(): string
    {
        return ShopCategoryColumns::IS_PUBLISHED->value;
    }

    public function dotIsPublished(): string
    {
        return $this->union->dot(ShopCategoryColumns::IS_PUBLISHED);
    }

    public function createdAt(): string
    {
        return ShopCategoryColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(ShopCategoryColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return ShopCategoryColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(ShopCategoryColumns::UPDATED_AT);
    }
}
