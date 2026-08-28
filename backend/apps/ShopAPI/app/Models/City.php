<?php

declare(strict_types=1);

namespace ShopAPI\Models;

use ShopAPI\Models\Concerns\GeneratesCodeOnSave;
use Autoteka\SchemaDefinition\Enums\Columns\CityColumns;
use Autoteka\SchemaDefinition\Enums\TableName;
use Autoteka\SchemaDefinition\SchemaTables\SchemaCity as SchemaCityTable;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShop;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $code
 * @property string $title
 * @property int $sort
 * @property float|null $latitude
 * @property float|null $longitude
 * @property bool $is_published
 */
class City extends Model
{
    use HasFactory;
    use GeneratesCodeOnSave;

    protected $table = TableName::CITY->value;

    protected $fillable = [
        CityColumns::CODE->value,
        CityColumns::TITLE->value,
        CityColumns::SORT->value,
        CityColumns::LATITUDE->value,
        CityColumns::LONGITUDE->value,
        CityColumns::IS_PUBLISHED->value,
    ];

    protected $casts = [
        CityColumns::SORT->value => 'integer',
        CityColumns::LATITUDE->value => 'float',
        CityColumns::LONGITUDE->value => 'float',
        CityColumns::IS_PUBLISHED->value => 'boolean',
    ];

    protected static function slugTitleColumn(): string
    {
        return (new SchemaCityTable())->title();
    }

    protected static function slugCodeColumn(): string
    {
        return (new SchemaCityTable())->code();
    }

    public function shops(): HasMany
    {
        $sch = new SchemaShop();

        return $this->hasMany(Shop::class, $sch->cityId());
    }
}
