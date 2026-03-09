<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\UsesTableName;
use App\Models\Concerns\GeneratesCodeOnSave;
use Autoteka\SchemaDefinition\Enums\TableName;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContactType extends Model
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
        return TableName::CONTACT_TYPE;
    }

    public function shopContacts(): HasMany
    {
        return $this->hasMany(ShopContact::class, 'contact_type_id');
    }
}
