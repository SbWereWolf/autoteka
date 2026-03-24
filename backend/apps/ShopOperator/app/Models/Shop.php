<?php

declare(strict_types=1);

namespace ShopOperator\Models;

use ShopOperator\Models\Concerns\UsesTableName;
use ShopOperator\Models\Concerns\GeneratesCodeOnSave;
use ShopOperator\Models\Concerns\NormalizesSiteUrlOnSave;
use Autoteka\SchemaDefinition\Enums\TableName;
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
 * @property \Illuminate\Database\Eloquent\Collection<int, ShopSchedule> $schedules
 * @property City|null $city
 */
class Shop extends Model
{
    use HasFactory;
    use GeneratesCodeOnSave;
    use NormalizesSiteUrlOnSave;
    use UsesTableName;

    protected $fillable = [
        'code',
        'title',
        'sort',
        'city_id',
        'description',
        'site_url',
        'slogan',
        'latitude',
        'longitude',
        'schedule_note',
        'thumb_path',
        'thumb_original_name',
        'is_published',
    ];

    protected $casts = [
        'sort' => 'integer',
        'city_id' => 'integer',
        'latitude' => 'float',
        'longitude' => 'float',
        'is_published' => 'boolean',
    ];

    protected $appends = [
        'category_links',
        'feature_links',
        'contact_entries',
        'gallery_entries',
        'schedule_entries',
    ];

    /**
     * @var array<string, mixed>
     */
    protected array $virtualInput = [];

    protected static function tableName(): TableName
    {
        return TableName::SHOP;
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class, 'city_id');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(
            Category::class,
            TableName::SHOP_CATEGORY->value,
            'shop_id',
            'category_id',
        )->withPivot(['is_published'])
            ->withTimestamps();
    }

    public function features(): BelongsToMany
    {
        return $this->belongsToMany(
            Feature::class,
            TableName::SHOP_FEATURE->value,
            'shop_id',
            'feature_id',
        )->withPivot(['is_published'])
            ->withTimestamps();
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(ShopContact::class, 'shop_id');
    }

    public function galleryImages(): HasMany
    {
        return $this->hasMany(ShopGalleryImage::class, 'shop_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(ShopSchedule::class, 'shop_id');
    }

    public function getCategoryLinksAttribute(): array
    {
        if (array_key_exists('category_links', $this->virtualInput)) {
            return $this->normalizeVirtualList($this->virtualInput['category_links']);
        }

        return $this->relationLoaded('categories')
            ? $this->categories
                ->map(fn (Category $category): array => [
                    'category_id' => $category->getKey(),
                    'is_published' => (bool) $category->pivot->getAttribute('is_published'),
                ])
                ->values()
                ->all()
            : [];
    }

    public function setCategoryLinksAttribute(mixed $value): void
    {
        $this->virtualInput['category_links'] = $value;
        unset($this->attributes['category_links']);
    }

    public function getFeatureLinksAttribute(): array
    {
        if (array_key_exists('feature_links', $this->virtualInput)) {
            return $this->normalizeVirtualList($this->virtualInput['feature_links']);
        }

        return $this->relationLoaded('features')
            ? $this->features
                ->map(fn (Feature $feature): array => [
                    'feature_id' => $feature->getKey(),
                    'is_published' => (bool) $feature->pivot->getAttribute('is_published'),
                ])
                ->values()
                ->all()
            : [];
    }

    public function setFeatureLinksAttribute(mixed $value): void
    {
        $this->virtualInput['feature_links'] = $value;
        unset($this->attributes['feature_links']);
    }

    public function getContactEntriesAttribute(): array
    {
        if (array_key_exists('contact_entries', $this->virtualInput)) {
            return $this->normalizeVirtualList($this->virtualInput['contact_entries']);
        }

        return $this->relationLoaded('contacts')
            ? $this->contacts
                ->map(fn (ShopContact $contact): array => [
                    'id' => $contact->getKey(),
                    'contact_type_id' => $contact->contact_type_id,
                    'value' => $contact->value,
                    'sort' => $contact->sort,
                    'is_published' => $contact->is_published,
                ])
                ->values()
                ->all()
            : [];
    }

    public function setContactEntriesAttribute(mixed $value): void
    {
        $this->virtualInput['contact_entries'] = $value;
        unset($this->attributes['contact_entries']);
    }

    public function getGalleryEntriesAttribute(): array
    {
        if (array_key_exists('gallery_entries', $this->virtualInput)) {
            return $this->normalizeVirtualList($this->virtualInput['gallery_entries']);
        }

        return $this->relationLoaded('galleryImages')
            ? $this->galleryImages
                ->map(fn (ShopGalleryImage $image): array => [
                    'id' => $image->getKey(),
                    'file_path' => $image->file_path,
                    'sort' => $image->sort,
                    'is_published' => $image->is_published,
                ])
                ->values()
                ->all()
            : [];
    }

    public function setGalleryEntriesAttribute(mixed $value): void
    {
        $this->virtualInput['gallery_entries'] = $value;
        unset($this->attributes['gallery_entries']);
    }

    public function getScheduleEntriesAttribute(): array
    {
        if (array_key_exists('schedule_entries', $this->virtualInput)) {
            return $this->normalizeVirtualList($this->virtualInput['schedule_entries']);
        }

        return $this->relationLoaded('schedules')
            ? $this->schedules
                ->map(fn (ShopSchedule $schedule): array => [
                    'id' => $schedule->getKey(),
                    'weekday' => $schedule->weekday,
                    'time_from' => $schedule->time_from,
                    'time_to' => $schedule->time_to,
                    'sort' => $schedule->sort,
                    'is_published' => $schedule->is_published,
                ])
                ->values()
                ->all()
            : [];
    }

    public function setScheduleEntriesAttribute(mixed $value): void
    {
        $this->virtualInput['schedule_entries'] = $value;
        unset($this->attributes['schedule_entries']);
    }

    private function normalizeVirtualList(mixed $value): array
    {
        if (! is_iterable($value)) {
            return [];
        }

        return collect($value)
            ->map(static fn (mixed $row): array => is_array($row) ? $row : [])
            ->values()
            ->all();
    }
}
