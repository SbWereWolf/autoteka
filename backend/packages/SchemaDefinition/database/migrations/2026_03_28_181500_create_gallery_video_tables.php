<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_gallery_video', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('shop_id')->constrained('shop')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('original_name')->nullable();
            $table->string('poster_path');
            $table->string('poster_original_name')->nullable();
            $table->string('mime');
            $table->unsignedInteger('sort')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
            $table->index('shop_id');
            $table->index(['shop_id', 'sort', 'id']);
        });

        Schema::create('promotion_gallery_video', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('promotion_id')->constrained('promotion')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('original_name')->nullable();
            $table->string('poster_path');
            $table->string('poster_original_name')->nullable();
            $table->string('mime');
            $table->unsignedInteger('sort')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
            $table->index('promotion_id');
            $table->index(['promotion_id', 'sort', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotion_gallery_video');
        Schema::dropIfExists('shop_gallery_video');
    }
};
