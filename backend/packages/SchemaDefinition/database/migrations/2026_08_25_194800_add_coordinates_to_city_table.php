<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('city', function (Blueprint $table): void {
            $table->double('latitude')->nullable()->after('sort');
            $table->double('longitude')->nullable()->after('latitude');
        });
    }

    public function down(): void
    {
        Schema::table('city', function (Blueprint $table): void {
            $table->dropColumn([
                'longitude',
                'latitude',
            ]);
        });
    }
};
