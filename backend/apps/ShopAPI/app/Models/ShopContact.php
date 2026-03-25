<?php

declare(strict_types=1);

namespace ShopAPI\Models;

use Autoteka\SchemaDefinition\Enums\Columns\ShopContactColumns;
use Autoteka\SchemaDefinition\Enums\TableName;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopContact;
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
        ShopContactColumns::SHOP_ID->value,
        ShopContactColumns::CONTACT_TYPE_ID->value,
        ShopContactColumns::VALUE->value,
        ShopContactColumns::SORT->value,
        ShopContactColumns::IS_PUBLISHED->value,
    ];

    protected $casts = [
        ShopContactColumns::SHOP_ID->value => 'integer',
        ShopContactColumns::CONTACT_TYPE_ID->value => 'integer',
        ShopContactColumns::SORT->value => 'integer',
        ShopContactColumns::IS_PUBLISHED->value => 'boolean',
    ];

    public function shop(): BelongsTo
    {
        $c = new SchemaShopContact();

        return $this->belongsTo(Shop::class, $c->shopId());
    }

    public function contactType(): BelongsTo
    {
        $c = new SchemaShopContact();

        return $this->belongsTo(ContactType::class, $c->contactTypeId());
    }
}
