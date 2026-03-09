<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
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
            $table->unique(['shop_id', 'file_path']);
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
            $table->unique(['shop_id']);
        });
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
};
