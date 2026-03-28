<?php

declare(strict_types=1);

namespace ShopAPI\Models;

use ShopAPI\Models\Concerns\GeneratesCodeOnSave;
use ShopAPI\Models\Concerns\NormalizesSiteUrlOnSave;
use Autoteka\SchemaDefinition\Enums\Columns\ShopCategoryColumns;
use Autoteka\SchemaDefinition\Enums\Columns\ShopColumns;
use Autoteka\SchemaDefinition\Enums\Columns\ShopContactColumns;
use Autoteka\SchemaDefinition\Enums\Columns\ShopFeatureColumns;
use Autoteka\SchemaDefinition\Enums\Columns\ShopGalleryImageColumns;
use Autoteka\SchemaDefinition\Enums\Columns\ShopGalleryVideoColumns;
use Autoteka\SchemaDefinition\Enums\Columns\ShopScheduleColumns;
use Autoteka\SchemaDefinition\Enums\TableName;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShop;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopCategory;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopContact;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopFeature;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopGalleryImage;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopGalleryVideo;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopSchedule;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $code
 * @property string $title
 * @property int $sort
 * @property int $city_id
 * @property string $description
 * @property string|null $site_url
 * @property string|null $slogan
 * @property float|null $latitude
 * @property float|null $longitude
 * @property string|null $schedule_note
 * @property string|null $thumb_path
 * @property string|null $thumb_original_name
 * @property bool $is_published
 * @property array<int, array{category_id: int, is_published: bool}> $category_links
 * @property array<int, array{feature_id: int, is_published: bool}> $feature_links
 * @property array<int, array{id: int, contact_type_id: int, value: string, sort: int, is_published: bool}> $contact_entries
 * @property array<int, array{id: int, file_path: string, sort: int, is_published: bool}> $gallery_entries
 * @property array<int, array{id: int, weekday: int, time_from: string, time_to: string, sort: int, is_published: bool}> $schedule_entries
 * @property \Illuminate\Database\Eloquent\Collection<int, Category> $categories
 * @property \Illuminate\Database\Eloquent\Collection<int, Feature> $features
 * @property \Illuminate\Database\Eloquent\Collection<int, ShopContact> $contacts
 * @property \Illuminate\Database\Eloquent\Collection<int, ShopGalleryImage> $galleryImages
 * @property \Illuminate\Database\Eloquent\Collection<int, ShopGalleryVideo> $galleryVideos
 * @property \Illuminate\Database\Eloquent\Collection<int, Promotion> $promotions
 * @property \Illuminate\Database\Eloquent\Collection<int, ShopSchedule> $schedules
 * @property City|null $city
 */
class Shop extends Model
{
    use HasFactory;
    use GeneratesCodeOnSave;
    use NormalizesSiteUrlOnSave;

    protected $table = TableName::SHOP->value;

    protected $fillable = [
        ShopColumns::CODE->value,
        ShopColumns::TITLE->value,
        ShopColumns::SORT->value,
        ShopColumns::CITY_ID->value,
        ShopColumns::DESCRIPTION->value,
        ShopColumns::SITE_URL->value,
        ShopColumns::SLOGAN->value,
        ShopColumns::LATITUDE->value,
        ShopColumns::LONGITUDE->value,
        ShopColumns::SCHEDULE_NOTE->value,
        ShopColumns::THUMB_PATH->value,
        ShopColumns::THUMB_ORIGINAL_NAME->value,
        ShopColumns::IS_PUBLISHED->value,
    ];

    protected $casts = [
        ShopColumns::SORT->value => 'integer',
        ShopColumns::CITY_ID->value => 'integer',
        ShopColumns::LATITUDE->value => 'float',
        ShopColumns::LONGITUDE->value => 'float',
        ShopColumns::IS_PUBLISHED->value => 'boolean',
    ];

    protected $appends = [
        'category_links',
        'feature_links',
        'contact_entries',
        'gallery_entries',
        'schedule_entries',
    ];

    protected static function slugTitleColumn(): string
    {
        return (new SchemaShop())->title();
    }

    protected static function slugCodeColumn(): string
    {
        return (new SchemaShop())->code();
    }

    public function city(): BelongsTo
    {
        $sch = new SchemaShop();

        return $this->belongsTo(City::class, $sch->cityId());
    }

    public function categories(): BelongsToMany
    {
        $p = new SchemaShopCategory();

        return $this->belongsToMany(
            Category::class,
            $p->table(),
            $p->shopId(),
            $p->categoryId(),
        )->withPivot([$p->isPublished()])
            ->withTimestamps();
    }

    public function features(): BelongsToMany
    {
        $p = new SchemaShopFeature();

        return $this->belongsToMany(
            Feature::class,
            $p->table(),
            $p->shopId(),
            $p->featureId(),
        )->withPivot([$p->isPublished()])
            ->withTimestamps();
    }

    public function contacts(): HasMany
    {
        $sch = new SchemaShopContact();

        return $this->hasMany(ShopContact::class, $sch->shopId());
    }

    public function galleryImages(): HasMany
    {
        $sch = new SchemaShopGalleryImage();

        return $this->hasMany(ShopGalleryImage::class, $sch->shopId());
    }

    public function galleryVideos(): HasMany
    {
        $schema = new SchemaShopGalleryVideo();

        return $this->hasMany(ShopGalleryVideo::class, $schema->shopId());
    }

    public function schedules(): HasMany
    {
        $sch = new SchemaShopSchedule();

        return $this->hasMany(ShopSchedule::class, $sch->shopId());
    }

    public function promotions(): HasMany
    {
        return $this->hasMany(Promotion::class, 'shop_id');
    }

    public function getCategoryLinksAttribute(): array
    {
        $p = new SchemaShopCategory();

        return $this->relationLoaded('categories')
            ? $this->categories
                ->map(fn (Category $category): array => [
                    ShopCategoryColumns::CATEGORY_ID->value => $category->getKey(),
                    ShopCategoryColumns::IS_PUBLISHED->value => (bool) $category->pivot->getAttribute($p->isPublished()),
                ])
                ->values()
                ->all()
            : [];
    }

    public function getFeatureLinksAttribute(): array
    {
        $p = new SchemaShopFeature();

        return $this->relationLoaded('features')
            ? $this->features
                ->map(fn (Feature $feature): array => [
                    ShopFeatureColumns::FEATURE_ID->value => $feature->getKey(),
                    ShopFeatureColumns::IS_PUBLISHED->value => (bool) $feature->pivot->getAttribute($p->isPublished()),
                ])
                ->values()
                ->all()
            : [];
    }

    public function getContactEntriesAttribute(): array
    {
        $c = new SchemaShopContact();

        return $this->relationLoaded('contacts')
            ? $this->contacts
                ->map(fn (ShopContact $contact): array => [
                    ShopContactColumns::ID->value => $contact->getKey(),
                    ShopContactColumns::CONTACT_TYPE_ID->value => $contact->contact_type_id,
                    ShopContactColumns::VALUE->value => $contact->value,
                    ShopContactColumns::SORT->value => $contact->sort,
                    ShopContactColumns::IS_PUBLISHED->value => $contact->is_published,
                ])
                ->values()
                ->all()
            : [];
    }

    public function getGalleryEntriesAttribute(): array
    {
        $g = new SchemaShopGalleryImage();

        return $this->relationLoaded('galleryImages')
            ? $this->galleryImages
                ->map(fn (ShopGalleryImage $image): array => [
                    ShopGalleryImageColumns::ID->value => $image->getKey(),
                    ShopGalleryImageColumns::FILE_PATH->value => $image->file_path,
                    ShopGalleryImageColumns::SORT->value => $image->sort,
                    ShopGalleryImageColumns::IS_PUBLISHED->value => $image->is_published,
                ])
                ->values()
                ->all()
            : [];
    }

    public function getGalleryVideoEntriesAttribute(): array
    {
        $schema = new SchemaShopGalleryVideo();

        return $this->relationLoaded('galleryVideos')
            ? $this->galleryVideos
                ->map(fn (ShopGalleryVideo $video): array => [
                    ShopGalleryVideoColumns::ID->value => $video->getKey(),
                    ShopGalleryVideoColumns::FILE_PATH->value => $video->file_path,
                    ShopGalleryVideoColumns::POSTER_PATH->value => $video->poster_path,
                    ShopGalleryVideoColumns::MIME->value => $video->mime,
                    ShopGalleryVideoColumns::SORT->value => $video->sort,
                    ShopGalleryVideoColumns::IS_PUBLISHED->value => $video->is_published,
                ])
                ->values()
                ->all()
            : [];
    }

    public function getScheduleEntriesAttribute(): array
    {
        $s = new SchemaShopSchedule();

        return $this->relationLoaded('schedules')
            ? $this->schedules
                ->map(fn (ShopSchedule $schedule): array => [
                    ShopScheduleColumns::ID->value => $schedule->getKey(),
                    ShopScheduleColumns::WEEKDAY->value => $schedule->weekday,
                    ShopScheduleColumns::TIME_FROM->value => $schedule->time_from,
                    ShopScheduleColumns::TIME_TO->value => $schedule->time_to,
                    ShopScheduleColumns::SORT->value => $schedule->sort,
                    ShopScheduleColumns::IS_PUBLISHED->value => $schedule->is_published,
                ])
                ->values()
                ->all()
            : [];
    }
}
