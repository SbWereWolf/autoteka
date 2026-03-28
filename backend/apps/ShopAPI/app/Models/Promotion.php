<?php

declare(strict_types=1);

namespace ShopAPI\Models;

use Autoteka\SchemaDefinition\Enums\Columns\PromotionColumns;
use Autoteka\SchemaDefinition\Enums\TableName;
use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotion;
use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotionGalleryVideo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $shop_id
 * @property string $code
 * @property string $title
 * @property string $description
 * @property string $start_date
 * @property string $end_date
 * @property bool $is_published
 * @property \Illuminate\Database\Eloquent\Collection<int, PromotionImage> $galleryImages
 * @property \Illuminate\Database\Eloquent\Collection<int, PromotionGalleryVideo> $galleryVideos
 * @property Shop|null $shop
 */
class Promotion extends Model
{
    use HasFactory;

    protected $table = TableName::PROMOTION->value;

    protected $fillable = [
        PromotionColumns::SHOP_ID->value,
        PromotionColumns::CODE->value,
        PromotionColumns::TITLE->value,
        PromotionColumns::DESCRIPTION->value,
        PromotionColumns::START_DATE->value,
        PromotionColumns::END_DATE->value,
        PromotionColumns::IS_PUBLISHED->value,
    ];

    protected $casts = [
        PromotionColumns::SHOP_ID->value => 'integer',
        PromotionColumns::IS_PUBLISHED->value => 'boolean',
        PromotionColumns::START_DATE->value => 'date:Y-m-d',
        PromotionColumns::END_DATE->value => 'date:Y-m-d',
    ];

    public function shop(): BelongsTo
    {
        $schema = new SchemaPromotion();

        return $this->belongsTo(Shop::class, $schema->shopId());
    }

    public function galleryImages(): HasMany
    {
        return $this->hasMany(PromotionImage::class, 'promotion_id');
    }

    public function galleryVideos(): HasMany
    {
        $schema = new SchemaPromotionGalleryVideo();

        return $this->hasMany(PromotionGalleryVideo::class, $schema->promotionId());
    }

    public function scopePublished(Builder $query): Builder
    {
        $schema = new SchemaPromotion();

        return $query->where($schema->isPublished(), true);
    }

    public function scopeActiveOnUtcDate(Builder $query, string $utcDate): Builder
    {
        $schema = new SchemaPromotion();

        return $query
            ->where($schema->startDate(), '<=', $utcDate)
            ->where($schema->endDate(), '>=', $utcDate);
    }

    public function scopeOrderedForShowcase(Builder $query): Builder
    {
        $schema = new SchemaPromotion();

        return $query
            ->orderBy($schema->startDate())
            ->orderBy($schema->id());
    }
}
