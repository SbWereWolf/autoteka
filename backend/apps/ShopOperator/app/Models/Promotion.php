<?php

declare(strict_types=1);

namespace ShopOperator\Models;

use Autoteka\SchemaDefinition\Enums\Columns\PromotionColumns;
use Autoteka\SchemaDefinition\Enums\Columns\PromotionImageColumns;
use Autoteka\SchemaDefinition\Enums\TableName;
use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotion;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $shop_id
 * @property string $code
 * @property string $title
 * @property string $description
 * @property string $start_date
 * @property string $end_date
 * @property bool $is_published
 * @property array<int, array{id: int, file_path: string, original_name: string|null, sort: int, is_published: bool}> $gallery_entries
 * @property \Illuminate\Database\Eloquent\Collection<int, PromotionImage> $galleryImages
 * @property Shop|null $shop
 */
class Promotion extends Model
{
    use HasFactory;

    protected $table = TableName::PROMOTION->value;

    protected $fillable = [
        PromotionColumns::SHOP_ID->value,
        PromotionColumns::CODE->value,
        PromotionColumns::TITLE->value,
        PromotionColumns::DESCRIPTION->value,
        PromotionColumns::START_DATE->value,
        PromotionColumns::END_DATE->value,
        PromotionColumns::IS_PUBLISHED->value,
    ];

    protected $casts = [
        PromotionColumns::SHOP_ID->value => 'integer',
        PromotionColumns::START_DATE->value => 'date:Y-m-d',
        PromotionColumns::END_DATE->value => 'date:Y-m-d',
        PromotionColumns::IS_PUBLISHED->value => 'boolean',
    ];

    protected $appends = [
        'gallery_entries',
    ];

    /**
     * @var array<string, mixed>
     */
    protected array $virtualInput = [];

    public function shop(): BelongsTo
    {
        $schema = new SchemaPromotion();

        return $this->belongsTo(Shop::class, $schema->shopId());
    }

    public function galleryImages(): HasMany
    {
        return $this->hasMany(PromotionImage::class, PromotionImageColumns::PROMOTION_ID->value);
    }

    public function getGalleryEntriesAttribute(): array
    {
        if (array_key_exists('gallery_entries', $this->virtualInput)) {
            return $this->normalizeVirtualList($this->virtualInput['gallery_entries']);
        }

        return $this->relationLoaded('galleryImages')
            ? $this->galleryImages
                ->map(fn (PromotionImage $image): array => [
                    PromotionImageColumns::ID->value => $image->getKey(),
                    PromotionImageColumns::FILE_PATH->value => $image->file_path,
                    PromotionImageColumns::ORIGINAL_NAME->value => $image->original_name,
                    PromotionImageColumns::SORT->value => $image->sort,
                    PromotionImageColumns::IS_PUBLISHED->value => $image->is_published,
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

    public function scopeFutureOrActiveForAdmin(Builder $query, string $today): Builder
    {
        $schema = new SchemaPromotion();

        return $query->where($schema->endDate(), '>=', $today);
    }

    public function scopeOrderedForAdmin(Builder $query): Builder
    {
        $schema = new SchemaPromotion();
        $today = now()->toDateString();

        return $query
            ->orderByRaw(
                "CASE WHEN {$schema->startDate()} > ? THEN 0 ELSE 1 END ASC",
                [$today],
            )
            ->orderBy($schema->startDate())
            ->orderBy($schema->id());
    }

    private function normalizeVirtualList(mixed $value): array
    {
        if (! is_iterable($value)) {
            return [];
        }

        return collect($value)
            ->map(static fn (mixed $item): mixed => is_array($item) ? $item : null)
            ->filter(static fn (mixed $item): bool => is_array($item))
            ->values()
            ->all();
    }
}
