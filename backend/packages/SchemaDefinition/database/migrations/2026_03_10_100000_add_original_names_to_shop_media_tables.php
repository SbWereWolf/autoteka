<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shop', function (Blueprint $table): void {
            if (! Schema::hasColumn('shop', 'thumb_original_name')) {
                $table->string('thumb_original_name')->nullable()->after('thumb_path');
            }
        });

        Schema::table('shop_gallery_image', function (Blueprint $table): void {
            if (! Schema::hasColumn('shop_gallery_image', 'original_name')) {
                $table->string('original_name')->nullable()->after('file_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('shop_gallery_image', function (Blueprint $table): void {
            if (Schema::hasColumn('shop_gallery_image', 'original_name')) {
                $table->dropColumn('original_name');
            }
        });

        Schema::table('shop', function (Blueprint $table): void {
            if (Schema::hasColumn('shop', 'thumb_original_name')) {
                $table->dropColumn('thumb_original_name');
            }
        });
    }
};

