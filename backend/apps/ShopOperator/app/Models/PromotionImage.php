<?php

declare(strict_types=1);

namespace ShopOperator\Models;

use Autoteka\SchemaDefinition\Enums\Columns\PromotionImageColumns;
use Autoteka\SchemaDefinition\Enums\TableName;
use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotionImage;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $promotion_id
 * @property string $file_path
 * @property string|null $original_name
 * @property int $sort
 * @property bool $is_published
 * @property Promotion|null $promotion
 */
class PromotionImage extends Model
{
    use HasFactory;

    protected $table = TableName::PROMOTION_GALLERY_IMAGE->value;

    protected $fillable = [
        PromotionImageColumns::PROMOTION_ID->value,
        PromotionImageColumns::FILE_PATH->value,
        PromotionImageColumns::ORIGINAL_NAME->value,
        PromotionImageColumns::SORT->value,
        PromotionImageColumns::IS_PUBLISHED->value,
    ];

    protected $casts = [
        PromotionImageColumns::PROMOTION_ID->value => 'integer',
        PromotionImageColumns::SORT->value => 'integer',
        PromotionImageColumns::IS_PUBLISHED->value => 'boolean',
    ];

    public function promotion(): BelongsTo
    {
        $schema = new SchemaPromotionImage();

        return $this->belongsTo(Promotion::class, $schema->promotionId());
    }
}
