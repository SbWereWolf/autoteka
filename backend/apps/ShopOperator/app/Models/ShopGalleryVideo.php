<?php

declare(strict_types=1);

namespace ShopOperator\Models;

use Autoteka\SchemaDefinition\Enums\Columns\ShopGalleryVideoColumns;
use Autoteka\SchemaDefinition\Enums\TableName;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopGalleryVideo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $shop_id
 * @property string $file_path
 * @property string|null $original_name
 * @property string $poster_path
 * @property string|null $poster_original_name
 * @property string $mime
 * @property int $sort
 * @property bool $is_published
 */
class ShopGalleryVideo extends Model
{
    use HasFactory;

    protected $table = TableName::SHOP_GALLERY_VIDEO->value;

    protected $fillable = [
        ShopGalleryVideoColumns::SHOP_ID->value,
        ShopGalleryVideoColumns::FILE_PATH->value,
        ShopGalleryVideoColumns::ORIGINAL_NAME->value,
        ShopGalleryVideoColumns::POSTER_PATH->value,
        ShopGalleryVideoColumns::POSTER_ORIGINAL_NAME->value,
        ShopGalleryVideoColumns::MIME->value,
        ShopGalleryVideoColumns::SORT->value,
        ShopGalleryVideoColumns::IS_PUBLISHED->value,
    ];

    protected $casts = [
        ShopGalleryVideoColumns::SHOP_ID->value => 'integer',
        ShopGalleryVideoColumns::SORT->value => 'integer',
        ShopGalleryVideoColumns::IS_PUBLISHED->value => 'boolean',
    ];

    public function shop(): BelongsTo
    {
        $schema = new SchemaShopGalleryVideo();

        return $this->belongsTo(Shop::class, $schema->shopId());
    }
}
