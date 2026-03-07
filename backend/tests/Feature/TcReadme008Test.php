<?php

declare(strict_types=1);

namespace Tests\Feature;

use Database\Seeders\AdminUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use MoonShine\Laravel\Models\MoonshineUser;
use Tests\TestCase;

class TcReadme008Test extends TestCase
{
    use RefreshDatabase;

    public function test_example_env_contains_moonshine_admin_keys(): void
    {
        $content = File::get(base_path('example.env'));
        $this->assertStringContainsString('MOONSHINE_ADMIN_', $content);
    }

    public function test_admin_user_seeder_creates_valid_account(): void
    {
        $this->artisan('migrate', ['--force' => true])->assertSuccessful();
        $this->seed(AdminUserSeeder::class);

        $user = MoonshineUser::query()->where('email', 'admin@example.com')->first();
        $this->assertNotNull($user, 'Сидер создаёт учётку admin@example.com');
    }
}
