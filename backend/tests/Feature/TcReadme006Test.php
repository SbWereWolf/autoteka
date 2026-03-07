<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class TcReadme006Test extends TestCase
{
    use RefreshDatabase;

    public function test_backend_example_env_exists(): void
    {
        $path = base_path('example.env');
        $this->assertTrue(File::exists($path), 'backend/example.env должен существовать');
    }

    public function test_admin_user_seeder_exists(): void
    {
        $path = base_path('database/seeders/AdminUserSeeder.php');
        $this->assertTrue(File::exists($path), 'AdminUserSeeder должен существовать');
    }

    public function test_artisan_migrate_and_seed_run_successfully(): void
    {
        $this->artisan('migrate', ['--force' => true])
            ->assertSuccessful();

        $this->artisan('db:seed', ['--class' => 'AdminUserSeeder', '--force' => true])
            ->assertSuccessful();
    }
}
