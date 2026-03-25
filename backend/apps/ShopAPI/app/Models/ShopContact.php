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
 * @property int $contact_type_id
 * @property string $value
 * @property int $sort
 * @property bool $is_published
 */
class ShopContact extends Model
{
    use HasFactory;

    protected $table = TableName::SHOP_CONTACT->value;

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

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'shop_id');
    }

    public function contactType(): BelongsTo
    {
        return $this->belongsTo(ContactType::class, 'contact_type_id');
    }
}
