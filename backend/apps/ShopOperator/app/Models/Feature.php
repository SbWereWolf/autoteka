<?php

declare(strict_types=1);

namespace ShopOperator\Models;

use ShopOperator\Models\Concerns\GeneratesCodeOnSave;
use Autoteka\SchemaDefinition\Enums\Columns\FeatureColumns;
use Autoteka\SchemaDefinition\Enums\TableName;
use Autoteka\SchemaDefinition\SchemaTables\SchemaFeature as SchemaFeatureTable;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopFeature;
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
class Feature extends Model
{
    use HasFactory;
    use GeneratesCodeOnSave;

    protected $table = TableName::FEATURE->value;

    protected $fillable = [
        FeatureColumns::CODE->value,
        FeatureColumns::TITLE->value,
        FeatureColumns::SORT->value,
        FeatureColumns::IS_PUBLISHED->value,
    ];

    protected $casts = [
        FeatureColumns::SORT->value => 'integer',
        FeatureColumns::IS_PUBLISHED->value => 'boolean',
    ];

    protected static function slugTitleColumn(): string
    {
        return (new SchemaFeatureTable())->title();
    }

    protected static function slugCodeColumn(): string
    {
        return (new SchemaFeatureTable())->code();
    }

    public function shops(): BelongsToMany
    {
        $p = new SchemaShopFeature();

        return $this->belongsToMany(
            Shop::class,
            $p->table(),
            $p->featureId(),
            $p->shopId(),
        );
    }
}
