<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;

    private const BUSINESS_FOREIGN_KEYS = [
        'shop_category' => ['shop_id', 'shop'],
        'shop_feature' => ['shop_id', 'shop'],
        'shop_contact' => ['shop_id', 'shop'],
        'shop_gallery_image' => ['shop_id', 'shop'],
        'shop_schedule' => ['shop_id', 'shop'],
        'promotion' => ['shop_id', 'shop'],
        'promotion_gallery_image' => ['promotion_id', 'promotion'],
        'shop_gallery_video' => ['shop_id', 'shop'],
        'promotion_gallery_video' => ['promotion_id', 'promotion'],
    ];

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
        $tables = array_merge(array_keys(self::BUSINESS_FOREIGN_KEYS), ['moonshine_users']);
        Schema::withoutForeignKeyConstraints(static function () use ($tables, $rule): void {
            DB::transaction(static function () use ($tables, $rule): void {
                $sequences = DB::table('sqlite_sequence')->whereIn('name', $tables)
                    ->get()->map(static fn (object $row): array => (array) $row)->all();

                foreach (self::BUSINESS_FOREIGN_KEYS as $name => [$column, $parent]) {
                    Schema::table($name, static function (Blueprint $table) use ($column, $parent, $rule): void {
                        $table->dropForeign([$column]);
                        $table->foreign($column)->references('id')->on($parent)
                            ->onDelete($rule)->noActionOnUpdate();
                    });
                }
                Schema::table('moonshine_users', static function (Blueprint $table) use ($rule): void {
                    $table->dropForeign(['moonshine_user_role_id']);
                    $table->foreign('moonshine_user_role_id')->references('id')->on('moonshine_user_roles')
                        ->onDelete($rule)->cascadeOnUpdate();
                });

                DB::table('sqlite_sequence')->whereIn('name', $tables)->delete();
                DB::table('sqlite_sequence')->insert($sequences);
            });
        });
    }
};
