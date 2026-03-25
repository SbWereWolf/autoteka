<?php

declare(strict_types=1);

namespace ShopAPI\Models;

use ShopAPI\Models\Concerns\GeneratesCodeOnSave;
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

    protected $table = TableName::FEATURE->value;

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
