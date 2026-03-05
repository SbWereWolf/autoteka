<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) env('MOONSHINE_ADMIN_EMAIL', 'admin@example.com');
        $password = (string) env('MOONSHINE_ADMIN_PASSWORD', 'admin12345');
        $name = (string) env('MOONSHINE_ADMIN_NAME', 'MoonShine Admin');

        User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => $password,
                'email_verified_at' => now(),
                'remember_token' => Str::random(10),
            ]
        );
    }
}
