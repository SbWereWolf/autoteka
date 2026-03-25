<?php

declare(strict_types=1);

namespace ShopAPI\Models;

use Autoteka\SchemaDefinition\Enums\Columns\ShopGalleryImageColumns;
use Autoteka\SchemaDefinition\Enums\TableName;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopGalleryImage;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $shop_id
 * @property string $file_path
 * @property string|null $original_name
 * @property int $sort
 * @property bool $is_published
 */
class ShopGalleryImage extends Model
{
    use HasFactory;

    protected $table = TableName::SHOP_GALLERY_IMAGE->value;

    protected $fillable = [
        ShopGalleryImageColumns::SHOP_ID->value,
        ShopGalleryImageColumns::FILE_PATH->value,
        ShopGalleryImageColumns::ORIGINAL_NAME->value,
        ShopGalleryImageColumns::SORT->value,
        ShopGalleryImageColumns::IS_PUBLISHED->value,
    ];

    protected $casts = [
        ShopGalleryImageColumns::SHOP_ID->value => 'integer',
        ShopGalleryImageColumns::SORT->value => 'integer',
        ShopGalleryImageColumns::IS_PUBLISHED->value => 'boolean',
    ];

    public function shop(): BelongsTo
    {
        $g = new SchemaShopGalleryImage();

        return $this->belongsTo(Shop::class, $g->shopId());
    }
}
