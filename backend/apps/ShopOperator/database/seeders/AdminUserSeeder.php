<?php

namespace Database\Seeders;

use Autoteka\SchemaDefinition\Enums\Columns\MoonshineUsersColumns;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use MoonShine\Laravel\Models\MoonshineUser;
use MoonShine\Laravel\Models\MoonshineUserRole;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) env('MOONSHINE_ADMIN_EMAIL', 'admin@example.com');
        $password = (string) env('MOONSHINE_ADMIN_PASSWORD', 'admin12345');
        $name = (string) env('MOONSHINE_ADMIN_NAME', 'MoonShine Admin');

        MoonshineUser::query()->updateOrCreate(
            [MoonshineUsersColumns::EMAIL->value => $email],
            [
                MoonshineUsersColumns::MOONSHINE_USER_ROLE_ID->value => MoonshineUserRole::DEFAULT_ROLE_ID,
                MoonshineUsersColumns::NAME->value => $name,
                MoonshineUsersColumns::PASSWORD->value => Hash::make($password),
                MoonshineUsersColumns::REMEMBER_TOKEN->value => Str::random(10),
            ]
        );
    }
}
