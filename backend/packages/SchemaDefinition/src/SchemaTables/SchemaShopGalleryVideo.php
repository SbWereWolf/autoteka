<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\ShopGalleryVideoColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaShopGalleryVideo extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::SHOP_GALLERY_VIDEO;
    }

    public function id(): string
    {
        return ShopGalleryVideoColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(ShopGalleryVideoColumns::ID);
    }

    public function shopId(): string
    {
        return ShopGalleryVideoColumns::SHOP_ID->value;
    }

    public function dotShopId(): string
    {
        return $this->union->dot(ShopGalleryVideoColumns::SHOP_ID);
    }

    public function filePath(): string
    {
        return ShopGalleryVideoColumns::FILE_PATH->value;
    }

    public function dotFilePath(): string
    {
        return $this->union->dot(ShopGalleryVideoColumns::FILE_PATH);
    }

    public function originalName(): string
    {
        return ShopGalleryVideoColumns::ORIGINAL_NAME->value;
    }

    public function dotOriginalName(): string
    {
        return $this->union->dot(ShopGalleryVideoColumns::ORIGINAL_NAME);
    }

    public function posterPath(): string
    {
        return ShopGalleryVideoColumns::POSTER_PATH->value;
    }

    public function dotPosterPath(): string
    {
        return $this->union->dot(ShopGalleryVideoColumns::POSTER_PATH);
    }

    public function posterOriginalName(): string
    {
        return ShopGalleryVideoColumns::POSTER_ORIGINAL_NAME->value;
    }

    public function dotPosterOriginalName(): string
    {
        return $this->union->dot(ShopGalleryVideoColumns::POSTER_ORIGINAL_NAME);
    }

    public function mime(): string
    {
        return ShopGalleryVideoColumns::MIME->value;
    }

    public function dotMime(): string
    {
        return $this->union->dot(ShopGalleryVideoColumns::MIME);
    }

    public function sort(): string
    {
        return ShopGalleryVideoColumns::SORT->value;
    }

    public function dotSort(): string
    {
        return $this->union->dot(ShopGalleryVideoColumns::SORT);
    }

    public function isPublished(): string
    {
        return ShopGalleryVideoColumns::IS_PUBLISHED->value;
    }

    public function dotIsPublished(): string
    {
        return $this->union->dot(ShopGalleryVideoColumns::IS_PUBLISHED);
    }

    public function createdAt(): string
    {
        return ShopGalleryVideoColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(ShopGalleryVideoColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return ShopGalleryVideoColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(ShopGalleryVideoColumns::UPDATED_AT);
    }
}
