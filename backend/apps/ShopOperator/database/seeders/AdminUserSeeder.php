<?php

namespace Database\Seeders;

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
            ['email' => $email],
            [
                'moonshine_user_role_id' => MoonshineUserRole::DEFAULT_ROLE_ID,
                'name' => $name,
                'password' => Hash::make($password),
                'remember_token' => Str::random(10),
            ]
        );
    }
}
