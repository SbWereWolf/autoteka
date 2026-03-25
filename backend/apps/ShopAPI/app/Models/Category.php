<?php

declare(strict_types=1);

namespace ShopAPI\Models;

use ShopAPI\Models\Concerns\GeneratesCodeOnSave;
use Autoteka\SchemaDefinition\Enums\Columns\CategoryColumns;
use Autoteka\SchemaDefinition\Enums\TableName;
use Autoteka\SchemaDefinition\SchemaTables\SchemaCategory as SchemaCategoryTable;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopCategory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property string $code
 * @property string $title
 * @property int $sort
 * @property bool $is_published
 */
class Category extends Model
{
    use HasFactory;
    use GeneratesCodeOnSave;

    protected $table = TableName::CATEGORY->value;

    protected $fillable = [
        CategoryColumns::CODE->value,
        CategoryColumns::TITLE->value,
        CategoryColumns::SORT->value,
        CategoryColumns::IS_PUBLISHED->value,
    ];

    protected $casts = [
        CategoryColumns::SORT->value => 'integer',
        CategoryColumns::IS_PUBLISHED->value => 'boolean',
    ];

    protected static function slugTitleColumn(): string
    {
        return (new SchemaCategoryTable())->title();
    }

    protected static function slugCodeColumn(): string
    {
        return (new SchemaCategoryTable())->code();
    }

    public function shops(): BelongsToMany
    {
        $p = new SchemaShopCategory();

        return $this->belongsToMany(
            Shop::class,
            $p->table(),
            $p->categoryId(),
            $p->shopId(),
        );
    }
}
