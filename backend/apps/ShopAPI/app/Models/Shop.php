<?php

declare(strict_types=1);

namespace ShopAPI\Models;

use ShopAPI\Models\Concerns\UsesTableName;
use ShopAPI\Models\Concerns\GeneratesCodeOnSave;
use ShopAPI\Models\Concerns\NormalizesSiteUrlOnSave;
use Autoteka\SchemaDefinition\Enums\TableName;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'thumb_path',
        'thumb_original_name',
        'is_published',
    ];

    protected $casts = [
        'sort' => 'integer',
        'city_id' => 'integer',
        'is_published' => 'boolean',
    ];

    protected $appends = [
        'category_links',
        'feature_links',
        'contact_entries',
        'gallery_entries',
        'schedule_entries',
        'schedule_note_text',
    ];

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
        );
    }

    public function features(): BelongsToMany
    {
        return $this->belongsToMany(
            Feature::class,
            TableName::SHOP_FEATURE->value,
            'shop_id',
            'feature_id',
        );
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

    public function scheduleNotes(): HasMany
    {
        return $this->hasMany(ShopScheduleNote::class, 'shop_id');
    }

    public function getCategoryLinksAttribute(): array
    {
        return $this->relationLoaded('categories')
            ? $this->categories
                ->map(fn (Category $category): array => ['category_id' => $category->getKey()])
                ->values()
                ->all()
            : [];
    }

    public function getFeatureLinksAttribute(): array
    {
        return $this->relationLoaded('features')
            ? $this->features
                ->map(fn (Feature $feature): array => ['feature_id' => $feature->getKey()])
                ->values()
                ->all()
            : [];
    }

    public function getContactEntriesAttribute(): array
    {
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

    public function getGalleryEntriesAttribute(): array
    {
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

    public function getScheduleEntriesAttribute(): array
    {
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

    public function getScheduleNoteTextAttribute(): string
    {
        if (! $this->relationLoaded('scheduleNotes')) {
            return '';
        }

        return (string) $this->scheduleNotes
            ->sortBy('sort')
            ->pluck('text')
            ->filter()
            ->implode("\n");
    }
}
