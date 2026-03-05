<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\UsesTableName;
use App\Support\Database\TableName;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopScheduleNote extends Model
{
    use HasFactory;
    use UsesTableName;

    protected $fillable = [
        'shop_id',
        'text',
        'sort',
        'is_published',
    ];

    protected $casts = [
        'shop_id' => 'integer',
        'sort' => 'integer',
        'is_published' => 'boolean',
    ];

    protected static function tableName(): TableName
    {
        return TableName::SHOP_SCHEDULE_NOTE;
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'shop_id');
    }
}
