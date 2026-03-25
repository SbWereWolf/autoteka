<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\ShopGalleryImageColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaShopGalleryImage extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::SHOP_GALLERY_IMAGE;
    }

    public function id(): string
    {
        return ShopGalleryImageColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(ShopGalleryImageColumns::ID);
    }

    public function shopId(): string
    {
        return ShopGalleryImageColumns::SHOP_ID->value;
    }

    public function dotShopId(): string
    {
        return $this->union->dot(ShopGalleryImageColumns::SHOP_ID);
    }

    public function filePath(): string
    {
        return ShopGalleryImageColumns::FILE_PATH->value;
    }

    public function dotFilePath(): string
    {
        return $this->union->dot(ShopGalleryImageColumns::FILE_PATH);
    }

    public function originalName(): string
    {
        return ShopGalleryImageColumns::ORIGINAL_NAME->value;
    }

    public function dotOriginalName(): string
    {
        return $this->union->dot(ShopGalleryImageColumns::ORIGINAL_NAME);
    }

    public function sort(): string
    {
        return ShopGalleryImageColumns::SORT->value;
    }

    public function dotSort(): string
    {
        return $this->union->dot(ShopGalleryImageColumns::SORT);
    }

    public function isPublished(): string
    {
        return ShopGalleryImageColumns::IS_PUBLISHED->value;
    }

    public function dotIsPublished(): string
    {
        return $this->union->dot(ShopGalleryImageColumns::IS_PUBLISHED);
    }

    public function createdAt(): string
    {
        return ShopGalleryImageColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(ShopGalleryImageColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return ShopGalleryImageColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(ShopGalleryImageColumns::UPDATED_AT);
    }
}
