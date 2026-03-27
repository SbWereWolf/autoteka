<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\PromotionImageColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaPromotionImage extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::PROMOTION_GALLERY_IMAGE;
    }

    public function id(): string
    {
        return PromotionImageColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(PromotionImageColumns::ID);
    }

    public function promotionId(): string
    {
        return PromotionImageColumns::PROMOTION_ID->value;
    }

    public function dotPromotionId(): string
    {
        return $this->union->dot(PromotionImageColumns::PROMOTION_ID);
    }

    public function filePath(): string
    {
        return PromotionImageColumns::FILE_PATH->value;
    }

    public function dotFilePath(): string
    {
        return $this->union->dot(PromotionImageColumns::FILE_PATH);
    }

    public function originalName(): string
    {
        return PromotionImageColumns::ORIGINAL_NAME->value;
    }

    public function dotOriginalName(): string
    {
        return $this->union->dot(PromotionImageColumns::ORIGINAL_NAME);
    }

    public function sort(): string
    {
        return PromotionImageColumns::SORT->value;
    }

    public function dotSort(): string
    {
        return $this->union->dot(PromotionImageColumns::SORT);
    }

    public function isPublished(): string
    {
        return PromotionImageColumns::IS_PUBLISHED->value;
    }

    public function dotIsPublished(): string
    {
        return $this->union->dot(PromotionImageColumns::IS_PUBLISHED);
    }

    public function createdAt(): string
    {
        return PromotionImageColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(PromotionImageColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return PromotionImageColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(PromotionImageColumns::UPDATED_AT);
    }
}
