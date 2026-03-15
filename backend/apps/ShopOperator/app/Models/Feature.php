<?php

declare(strict_types=1);

namespace ShopOperator\Models;

use ShopOperator\Models\Concerns\UsesTableName;
use ShopOperator\Models\Concerns\GeneratesCodeOnSave;
use Autoteka\SchemaDefinition\Enums\TableName;
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
    use UsesTableName;

    protected $fillable = [
        'code',
        'title',
        'sort',
        'is_published',
    ];

    protected $casts = [
        'sort' => 'integer',
        'is_published' => 'boolean',
    ];

    protected static function tableName(): TableName
    {
        return TableName::FEATURE;
    }

    public function shops(): BelongsToMany
    {
        return $this->belongsToMany(
            Shop::class,
            TableName::SHOP_FEATURE->value,
            'feature_id',
            'shop_id',
        );
    }
}
