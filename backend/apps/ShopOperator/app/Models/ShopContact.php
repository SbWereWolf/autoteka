<?php

declare(strict_types=1);

namespace ShopOperator\Models;

use ShopOperator\Models\Concerns\UsesTableName;
use Autoteka\SchemaDefinition\Enums\TableName;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopContact extends Model
{
    use HasFactory;
    use UsesTableName;

    protected $fillable = [
        'shop_id',
        'contact_type_id',
        'value',
        'sort',
        'is_published',
    ];

    protected $casts = [
        'shop_id' => 'integer',
        'contact_type_id' => 'integer',
        'sort' => 'integer',
        'is_published' => 'boolean',
    ];

    protected static function tableName(): TableName
    {
        return TableName::SHOP_CONTACT;
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'shop_id');
    }

    public function contactType(): BelongsTo
    {
        return $this->belongsTo(ContactType::class, 'contact_type_id');
    }
}
