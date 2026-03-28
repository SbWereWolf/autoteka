<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\PromotionGalleryVideoColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaPromotionGalleryVideo extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::PROMOTION_GALLERY_VIDEO;
    }

    public function id(): string
    {
        return PromotionGalleryVideoColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(PromotionGalleryVideoColumns::ID);
    }

    public function promotionId(): string
    {
        return PromotionGalleryVideoColumns::PROMOTION_ID->value;
    }

    public function dotPromotionId(): string
    {
        return $this->union->dot(PromotionGalleryVideoColumns::PROMOTION_ID);
    }

    public function filePath(): string
    {
        return PromotionGalleryVideoColumns::FILE_PATH->value;
    }

    public function dotFilePath(): string
    {
        return $this->union->dot(PromotionGalleryVideoColumns::FILE_PATH);
    }

    public function originalName(): string
    {
        return PromotionGalleryVideoColumns::ORIGINAL_NAME->value;
    }

    public function dotOriginalName(): string
    {
        return $this->union->dot(PromotionGalleryVideoColumns::ORIGINAL_NAME);
    }

    public function posterPath(): string
    {
        return PromotionGalleryVideoColumns::POSTER_PATH->value;
    }

    public function dotPosterPath(): string
    {
        return $this->union->dot(PromotionGalleryVideoColumns::POSTER_PATH);
    }

    public function posterOriginalName(): string
    {
        return PromotionGalleryVideoColumns::POSTER_ORIGINAL_NAME->value;
    }

    public function dotPosterOriginalName(): string
    {
        return $this->union->dot(PromotionGalleryVideoColumns::POSTER_ORIGINAL_NAME);
    }

    public function mime(): string
    {
        return PromotionGalleryVideoColumns::MIME->value;
    }

    public function dotMime(): string
    {
        return $this->union->dot(PromotionGalleryVideoColumns::MIME);
    }

    public function sort(): string
    {
        return PromotionGalleryVideoColumns::SORT->value;
    }

    public function dotSort(): string
    {
        return $this->union->dot(PromotionGalleryVideoColumns::SORT);
    }

    public function isPublished(): string
    {
        return PromotionGalleryVideoColumns::IS_PUBLISHED->value;
    }

    public function dotIsPublished(): string
    {
        return $this->union->dot(PromotionGalleryVideoColumns::IS_PUBLISHED);
    }

    public function createdAt(): string
    {
        return PromotionGalleryVideoColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(PromotionGalleryVideoColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return PromotionGalleryVideoColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(PromotionGalleryVideoColumns::UPDATED_AT);
    }
}
