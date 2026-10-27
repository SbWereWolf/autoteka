<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;

    public function up(): void
    {
        $this->changeDeleteRule('restrict');
    }

    public function down(): void
    {
        $this->changeDeleteRule('cascade');
    }

    private function changeDeleteRule(string $rule): void
    {
        Schema::withoutForeignKeyConstraints(static function () use ($rule): void {
            DB::transaction(static function () use ($rule): void {
                $sequences = DB::table('sqlite_sequence')->where('name', 'promotion_image')
                    ->get()->map(static fn (object $row): array => (array) $row)->all();
                Schema::table('promotion_image', static function (Blueprint $table) use ($rule): void {
                    $table->dropForeign(['promotion_id']);
                    $table->foreign('promotion_id')->references('id')->on('promotion')
                        ->onDelete($rule)->noActionOnUpdate();
                });
                DB::table('sqlite_sequence')->where('name', 'promotion_image')->delete();
                DB::table('sqlite_sequence')->insert($sequences);
            });
        });
    }
};
