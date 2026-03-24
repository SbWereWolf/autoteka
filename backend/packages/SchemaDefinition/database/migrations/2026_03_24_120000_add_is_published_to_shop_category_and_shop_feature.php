<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shop_category', function (Blueprint $table): void {
            $table->boolean('is_published')->default(true)->after('category_id');
        });

        Schema::table('shop_feature', function (Blueprint $table): void {
            $table->boolean('is_published')->default(true)->after('feature_id');
        });
    }

    public function down(): void
    {
        Schema::table('shop_category', function (Blueprint $table): void {
            $table->dropColumn('is_published');
        });

        Schema::table('shop_feature', function (Blueprint $table): void {
            $table->dropColumn('is_published');
        });
    }
};
