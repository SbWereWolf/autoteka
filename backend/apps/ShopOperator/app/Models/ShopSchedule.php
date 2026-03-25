<?php

declare(strict_types=1);

namespace ShopOperator\Models;

use Autoteka\SchemaDefinition\Enums\Columns\ShopScheduleColumns;
use Autoteka\SchemaDefinition\Enums\TableName;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopSchedule;
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
        ShopScheduleColumns::SHOP_ID->value,
        ShopScheduleColumns::WEEKDAY->value,
        ShopScheduleColumns::TIME_FROM->value,
        ShopScheduleColumns::TIME_TO->value,
        ShopScheduleColumns::SORT->value,
        ShopScheduleColumns::IS_PUBLISHED->value,
    ];

    protected $casts = [
        ShopScheduleColumns::SHOP_ID->value => 'integer',
        ShopScheduleColumns::SORT->value => 'integer',
        ShopScheduleColumns::IS_PUBLISHED->value => 'boolean',
    ];

    public function shop(): BelongsTo
    {
        $s = new SchemaShopSchedule();

        return $this->belongsTo(Shop::class, $s->shopId());
    }
}
