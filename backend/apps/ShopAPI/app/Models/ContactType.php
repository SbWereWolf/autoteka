<?php

declare(strict_types=1);

namespace ShopAPI\Models;

use ShopAPI\Models\Concerns\GeneratesCodeOnSave;
use Autoteka\SchemaDefinition\Enums\Columns\ContactTypeColumns;
use Autoteka\SchemaDefinition\Enums\TableName;
use Autoteka\SchemaDefinition\SchemaTables\SchemaContactType as SchemaContactTypeTable;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopContact;
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
class ContactType extends Model
{
    use HasFactory;
    use GeneratesCodeOnSave;

    protected $table = TableName::CONTACT_TYPE->value;

    protected $fillable = [
        ContactTypeColumns::CODE->value,
        ContactTypeColumns::TITLE->value,
        ContactTypeColumns::SORT->value,
        ContactTypeColumns::IS_PUBLISHED->value,
    ];

    protected $casts = [
        ContactTypeColumns::SORT->value => 'integer',
        ContactTypeColumns::IS_PUBLISHED->value => 'boolean',
    ];

    protected static function slugTitleColumn(): string
    {
        return (new SchemaContactTypeTable())->title();
    }

    protected static function slugCodeColumn(): string
    {
        return (new SchemaContactTypeTable())->code();
    }

    public function shopContacts(): HasMany
    {
        $c = new SchemaShopContact();

        return $this->hasMany(ShopContact::class, $c->contactTypeId());
    }
}
