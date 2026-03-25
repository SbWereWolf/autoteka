<?php

declare(strict_types=1);

namespace ShopOperator\Models;

use ShopOperator\Models\Concerns\GeneratesCodeOnSave;
use Autoteka\SchemaDefinition\Enums\TableName;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $code
 * @property string $title
 * @property int $sort
 * @property bool $is_published
 */
class City extends Model
{
    use HasFactory;
    use GeneratesCodeOnSave;

    protected $table = TableName::CITY->value;

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

    public function shops(): HasMany
    {
        return $this->hasMany(Shop::class, 'city_id');
    }
}
