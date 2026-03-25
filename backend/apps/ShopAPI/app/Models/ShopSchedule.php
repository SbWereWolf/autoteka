<?php

declare(strict_types=1);

namespace ShopAPI\Models;

use Autoteka\SchemaDefinition\Enums\TableName;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $shop_id
 * @property int $weekday
 * @property string $time_from
 * @property string $time_to
 * @property int $sort
 * @property bool $is_published
 */
class ShopSchedule extends Model
{
    use HasFactory;

    protected $table = TableName::SHOP_SCHEDULE->value;

    protected $fillable = [
        'shop_id',
        'weekday',
        'time_from',
        'time_to',
        'sort',
        'is_published',
    ];

    protected $casts = [
        'shop_id' => 'integer',
        'sort' => 'integer',
        'is_published' => 'boolean',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'shop_id');
    }
}
