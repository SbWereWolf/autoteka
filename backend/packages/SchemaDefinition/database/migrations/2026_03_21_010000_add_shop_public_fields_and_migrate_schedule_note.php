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
        Schema::table('shop', function (Blueprint $table): void {
            $table->string('slogan')->nullable()->after('site_url');
            $table->double('latitude')->nullable()->after('slogan');
            $table->double('longitude')->nullable()->after('latitude');
            $table->text('schedule_note')->nullable()->after('longitude');
        });

        DB::table('shop')->update([
            'slogan' => DB::raw('title'),
        ]);

        $scheduleNotes = DB::table('shop_schedule_note')
            ->orderBy('sort')
            ->orderBy('id')
            ->get(['shop_id', 'text']);

        foreach ($scheduleNotes as $scheduleNote) {
            DB::table('shop')
                ->where('id', $scheduleNote->shop_id)
                ->update([
                    'schedule_note' => $scheduleNote->text,
                ]);
        }

        Schema::drop('shop_schedule_note');
    }

    public function down(): void
    {
        Schema::create('shop_schedule_note', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('shop_id')->constrained('shop')->cascadeOnDelete();
            $table->text('text');
            $table->unsignedInteger('sort')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
            $table->unique(['shop_id']);
        });

        $shops = DB::table('shop')
            ->orderBy('id')
            ->get(['id', 'schedule_note', 'created_at', 'updated_at']);

        foreach ($shops as $shop) {
            DB::table('shop_schedule_note')->insert([
                'shop_id' => $shop->id,
                'text' => (string) $shop->schedule_note,
                'sort' => 0,
                'is_published' => true,
                'created_at' => $shop->created_at,
                'updated_at' => $shop->updated_at,
            ]);
        }

        Schema::table('shop', function (Blueprint $table): void {
            $table->dropColumn([
                'schedule_note',
                'longitude',
                'latitude',
                'slogan',
            ]);
        });
    }
};
