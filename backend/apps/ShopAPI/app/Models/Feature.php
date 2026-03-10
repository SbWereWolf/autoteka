<?php

declare(strict_types=1);

namespace ShopAPI\Models;

use ShopAPI\Models\Concerns\UsesTableName;
use ShopAPI\Models\Concerns\GeneratesCodeOnSave;
use Autoteka\SchemaDefinition\Enums\TableName;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
