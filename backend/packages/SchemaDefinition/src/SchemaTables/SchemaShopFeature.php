<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\ShopFeatureColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaShopFeature extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::SHOP_FEATURE;
    }

    public function id(): string
    {
        return ShopFeatureColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(ShopFeatureColumns::ID);
    }

    public function shopId(): string
    {
        return ShopFeatureColumns::SHOP_ID->value;
    }

    public function dotShopId(): string
    {
        return $this->union->dot(ShopFeatureColumns::SHOP_ID);
    }

    public function featureId(): string
    {
        return ShopFeatureColumns::FEATURE_ID->value;
    }

    public function dotFeatureId(): string
    {
        return $this->union->dot(ShopFeatureColumns::FEATURE_ID);
    }

    public function isPublished(): string
    {
        return ShopFeatureColumns::IS_PUBLISHED->value;
    }

    public function dotIsPublished(): string
    {
        return $this->union->dot(ShopFeatureColumns::IS_PUBLISHED);
    }

    public function createdAt(): string
    {
        return ShopFeatureColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(ShopFeatureColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return ShopFeatureColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(ShopFeatureColumns::UPDATED_AT);
    }
}
