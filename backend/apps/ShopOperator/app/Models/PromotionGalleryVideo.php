<?php

declare(strict_types=1);

namespace ShopOperator\Models;

use Autoteka\SchemaDefinition\Enums\Columns\PromotionGalleryVideoColumns;
use Autoteka\SchemaDefinition\Enums\TableName;
use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotionGalleryVideo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $promotion_id
 * @property string $file_path
 * @property string|null $original_name
 * @property string $poster_path
 * @property string|null $poster_original_name
 * @property string $mime
 * @property int $sort
 * @property bool $is_published
 * @property Promotion|null $promotion
 */
class PromotionGalleryVideo extends Model
{
    use HasFactory;

    protected $table = TableName::PROMOTION_GALLERY_VIDEO->value;

    protected $fillable = [
        PromotionGalleryVideoColumns::PROMOTION_ID->value,
        PromotionGalleryVideoColumns::FILE_PATH->value,
        PromotionGalleryVideoColumns::ORIGINAL_NAME->value,
        PromotionGalleryVideoColumns::POSTER_PATH->value,
        PromotionGalleryVideoColumns::POSTER_ORIGINAL_NAME->value,
        PromotionGalleryVideoColumns::MIME->value,
        PromotionGalleryVideoColumns::SORT->value,
        PromotionGalleryVideoColumns::IS_PUBLISHED->value,
    ];

    protected $casts = [
        PromotionGalleryVideoColumns::PROMOTION_ID->value => 'integer',
        PromotionGalleryVideoColumns::SORT->value => 'integer',
        PromotionGalleryVideoColumns::IS_PUBLISHED->value => 'boolean',
    ];

    public function promotion(): BelongsTo
    {
        $schema = new SchemaPromotionGalleryVideo();

        return $this->belongsTo(Promotion::class, $schema->promotionId());
    }
}
