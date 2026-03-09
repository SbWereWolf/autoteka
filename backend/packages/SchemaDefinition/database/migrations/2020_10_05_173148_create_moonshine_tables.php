<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('moonshine_users', static function (Blueprint $table): void {
            $table->id();

            $table->foreignId('moonshine_user_role_id')
                ->default(1)
                ->constrained('moonshine_user_roles')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            $table->string('email', 190)->unique();
            $table->string('password');
            $table->string('name');
            $table->string('avatar')->nullable();
            $table->string('remember_token', 100)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('moonshine_users');
    }
};
