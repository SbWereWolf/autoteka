<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('city', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');
            $table->unsignedInteger('sort')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        Schema::create('category', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');
            $table->unsignedInteger('sort')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        Schema::create('feature', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');
            $table->unsignedInteger('sort')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        Schema::create('contact_type', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');
            $table->unsignedInteger('sort')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        Schema::create('shop', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');
            $table->unsignedInteger('sort')->default(0);
            $table->foreignId('city_id')->constrained('city');
            $table->text('description')->default('');
            $table->string('site_url')->default('');
            $table->string('thumb_path')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        Schema::create('shop_category', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('shop_id')->constrained('shop')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('category');
            $table->timestamps();
            $table->unique(['shop_id', 'category_id']);
        });

        Schema::create('shop_feature', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('shop_id')->constrained('shop')->cascadeOnDelete();
            $table->foreignId('feature_id')->constrained('feature');
            $table->timestamps();
            $table->unique(['shop_id', 'feature_id']);
        });

        Schema::create('shop_contact', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('shop_id')->constrained('shop')->cascadeOnDelete();
            $table->foreignId('contact_type_id')->constrained('contact_type');
            $table->string('value');
            $table->unsignedInteger('sort')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        Schema::create('shop_gallery_image', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('shop_id')->constrained('shop')->cascadeOnDelete();
            $table->string('file_path');
            $table->unsignedInteger('sort')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        Schema::create('shop_schedule', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('shop_id')->constrained('shop')->cascadeOnDelete();
            $table->unsignedTinyInteger('weekday');
            $table->string('time_from', 5);
            $table->string('time_to', 5);
            $table->unsignedInteger('sort')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
            $table->unique(['shop_id', 'weekday']);
        });

        Schema::create('shop_schedule_note', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('shop_id')->constrained('shop')->cascadeOnDelete();
            $table->text('text');
            $table->unsignedInteger('sort')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        $this->seedFromMocks();
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_schedule_note');
        Schema::dropIfExists('shop_schedule');
        Schema::dropIfExists('shop_gallery_image');
        Schema::dropIfExists('shop_contact');
        Schema::dropIfExists('shop_feature');
        Schema::dropIfExists('shop_category');
        Schema::dropIfExists('shop');
        Schema::dropIfExists('contact_type');
        Schema::dropIfExists('feature');
        Schema::dropIfExists('category');
        Schema::dropIfExists('city');
    }

    private function seedFromMocks(): void
    {
        $now = now();
        $mocksPath = base_path('../frontend/src/mocks');

        /** @var array<int, array{code: string, name: string, sort: int}> $cityList */
        $cityList = json_decode(
            file_get_contents($mocksPath . '/city-list.json') ?: '[]',
            true,
            512,
            JSON_THROW_ON_ERROR,
        );
        /** @var array<int, array{code: string, name: string, sort: int}> $categoryList */
        $categoryList = json_decode(
            file_get_contents($mocksPath . '/category-list.json') ?: '[]',
            true,
            512,
            JSON_THROW_ON_ERROR,
        );
        /** @var array<int, array{code: string, name: string, sort: int}> $featureList */
        $featureList = json_decode(
            file_get_contents($mocksPath . '/feature-list.json') ?: '[]',
            true,
            512,
            JSON_THROW_ON_ERROR,
        );
        /** @var array<int, array<string, mixed>> $shopList */
        $shopList = json_decode(
            file_get_contents($mocksPath . '/shops.json') ?: '[]',
            true,
            512,
            JSON_THROW_ON_ERROR,
        );

        DB::table('city')->insert(array_map(
            static fn (array $city): array => [
                'code' => $city['code'],
                'title' => $city['name'],
                'sort' => $city['sort'],
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            $cityList,
        ));

        DB::table('category')->insert(array_map(
            static fn (array $category): array => [
                'code' => $category['code'],
                'title' => $category['name'],
                'sort' => $category['sort'],
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            $categoryList,
        ));

        DB::table('feature')->insert(array_map(
            static fn (array $feature): array => [
                'code' => $feature['code'],
                'title' => $feature['name'],
                'sort' => $feature['sort'],
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            $featureList,
        ));

        $contactTypeRows = collect($shopList)
            ->flatMap(static fn (array $shop): array => $shop['contacts'] ?? [])
            ->pluck('type')
            ->filter()
            ->unique()
            ->values()
            ->map(static fn (string $type, int $index) => [
                'code' => $type,
                'title' => $type,
                'sort' => $index * 10,
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->all();

        DB::table('contact_type')->insert($contactTypeRows);

        $cityIdByCode = DB::table('city')->pluck('id', 'code')->all();
        $categoryIdByCode = DB::table('category')->pluck('id', 'code')->all();
        $featureIdByCode = DB::table('feature')->pluck('id', 'code')->all();
        $contactTypeIdByCode = DB::table('contact_type')->pluck('id', 'code')->all();

        $shopRows = [];
        foreach ($shopList as $index => $shop) {
            $shopRows[] = [
                'code' => (string) $shop['code'],
                'title' => (string) $shop['name'],
                'sort' => $index * 10,
                'city_id' => $cityIdByCode[(string) $shop['cityCode']],
                'description' => (string) ($shop['description'] ?? ''),
                'site_url' => (string) ($shop['siteUrl'] ?? ''),
                'thumb_path' => $this->normalizeMediaPath($shop['thumbUrl'] ?? null),
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('shop')->insert($shopRows);
        $shopIdByCode = DB::table('shop')->pluck('id', 'code')->all();

        $shopCategoryRows = [];
        $shopFeatureRows = [];
        $shopContactRows = [];
        $shopGalleryRows = [];
        $shopScheduleNoteRows = [];

        foreach ($shopList as $shopIndex => $shop) {
            $shopId = $shopIdByCode[(string) $shop['code']];

            foreach (($shop['categoryCodes'] ?? []) as $categoryCode) {
                $shopCategoryRows[] = [
                    'shop_id' => $shopId,
                    'category_id' => $categoryIdByCode[(string) $categoryCode],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            foreach (($shop['featureCodes'] ?? []) as $featureCode) {
                $shopFeatureRows[] = [
                    'shop_id' => $shopId,
                    'feature_id' => $featureIdByCode[(string) $featureCode],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            foreach (($shop['contacts'] ?? []) as $contactIndex => $contact) {
                $shopContactRows[] = [
                    'shop_id' => $shopId,
                    'contact_type_id' => $contactTypeIdByCode[(string) $contact['type']],
                    'value' => (string) $contact['value'],
                    'sort' => $contactIndex * 10,
                    'is_published' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            foreach (($shop['galleryImages'] ?? []) as $imageIndex => $image) {
                $normalizedPath = $this->normalizeMediaPath($image);
                if ($normalizedPath === null) {
                    continue;
                }

                $shopGalleryRows[] = [
                    'shop_id' => $shopId,
                    'file_path' => $normalizedPath,
                    'sort' => $imageIndex * 10,
                    'is_published' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            $workHours = trim((string) ($shop['workHours'] ?? ''));
            if ($workHours !== '') {
                $shopScheduleNoteRows[] = [
                    'shop_id' => $shopId,
                    'text' => $workHours,
                    'sort' => $shopIndex * 10,
                    'is_published' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if ($shopCategoryRows !== []) {
            DB::table('shop_category')->insert($shopCategoryRows);
        }

        if ($shopFeatureRows !== []) {
            DB::table('shop_feature')->insert($shopFeatureRows);
        }

        if ($shopContactRows !== []) {
            DB::table('shop_contact')->insert($shopContactRows);
        }

        if ($shopGalleryRows !== []) {
            DB::table('shop_gallery_image')->insert($shopGalleryRows);
        }

        if ($shopScheduleNoteRows !== []) {
            DB::table('shop_schedule_note')->insert($shopScheduleNoteRows);
        }
    }

    private function normalizeMediaPath(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            return null;
        }

        return ltrim($trimmed, '/');
    }
};
