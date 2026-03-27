<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition\SchemaTables;

use Autoteka\SchemaDefinition\Enums\Columns\PromotionColumns;
use Autoteka\SchemaDefinition\Enums\TableName;

final class SchemaPromotion extends AbstractSchemaTable
{
    protected static function tableEnum(): TableName
    {
        return TableName::PROMOTION;
    }

    public function id(): string
    {
        return PromotionColumns::ID->value;
    }

    public function dotId(): string
    {
        return $this->union->dot(PromotionColumns::ID);
    }

    public function shopId(): string
    {
        return PromotionColumns::SHOP_ID->value;
    }

    public function dotShopId(): string
    {
        return $this->union->dot(PromotionColumns::SHOP_ID);
    }

    public function code(): string
    {
        return PromotionColumns::CODE->value;
    }

    public function dotCode(): string
    {
        return $this->union->dot(PromotionColumns::CODE);
    }

    public function title(): string
    {
        return PromotionColumns::TITLE->value;
    }

    public function dotTitle(): string
    {
        return $this->union->dot(PromotionColumns::TITLE);
    }

    public function description(): string
    {
        return PromotionColumns::DESCRIPTION->value;
    }

    public function dotDescription(): string
    {
        return $this->union->dot(PromotionColumns::DESCRIPTION);
    }

    public function startDate(): string
    {
        return PromotionColumns::START_DATE->value;
    }

    public function dotStartDate(): string
    {
        return $this->union->dot(PromotionColumns::START_DATE);
    }

    public function endDate(): string
    {
        return PromotionColumns::END_DATE->value;
    }

    public function dotEndDate(): string
    {
        return $this->union->dot(PromotionColumns::END_DATE);
    }

    public function isPublished(): string
    {
        return PromotionColumns::IS_PUBLISHED->value;
    }

    public function dotIsPublished(): string
    {
        return $this->union->dot(PromotionColumns::IS_PUBLISHED);
    }

    public function createdAt(): string
    {
        return PromotionColumns::CREATED_AT->value;
    }

    public function dotCreatedAt(): string
    {
        return $this->union->dot(PromotionColumns::CREATED_AT);
    }

    public function updatedAt(): string
    {
        return PromotionColumns::UPDATED_AT->value;
    }

    public function dotUpdatedAt(): string
    {
        return $this->union->dot(PromotionColumns::UPDATED_AT);
    }
}
