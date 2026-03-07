<?php

declare(strict_types=1);

namespace Tests\Feature;

use Database\Seeders\AdminUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use MoonShine\Laravel\Models\MoonshineUser;
use Tests\TestCase;

class TcBackendReadmeTest extends TestCase
{
    use RefreshDatabase;

    public function test_tc_backend_readme_001_laravel_12(): void
    {
        $composer = json_decode(File::get(base_path('composer.json')), true);
        $laravel = $composer['require']['laravel/framework'] ?? '';
        $this->assertStringStartsWith('^12', $laravel, 'Laravel должен быть major 12');
    }

    public function test_tc_backend_readme_002_api_routes(): void
    {
        $response = $this->getJson('/api/v1/city-list');
        $response->assertOk();
    }

    public function test_tc_backend_readme_003_moonshine_4(): void
    {
        $composer = json_decode(File::get(base_path('composer.json')), true);
        $this->assertArrayHasKey('moonshine/moonshine', $composer['require']);
        $this->assertStringStartsWith('^4', $composer['require']['moonshine/moonshine']);
        $this->get('/admin/login')->assertOk();
    }

    public function test_tc_backend_readme_004_quick_start_steps(): void
    {
        $this->assertTrue(File::exists(base_path('example.env')));
        $this->assertTrue(File::exists(base_path('database/seeders/AdminUserSeeder.php')));
        $this->artisan('migrate', ['--force' => true])->assertSuccessful();
        $this->artisan('db:seed', ['--class' => 'AdminUserSeeder', '--force' => true])->assertSuccessful();
    }

    public function test_tc_backend_readme_005_tinker(): void
    {
        $result = Process::run(['php', base_path('artisan'), 'tinker', '--execute=echo 1;']);
        $this->assertTrue($result->successful(), 'tinker должен запускаться');
    }

    public function test_tc_backend_readme_006_db_facade_in_tinker(): void
    {
        $result = Process::run([
            'php', base_path('artisan'), 'tinker', '--execute',
            'DB::connection()->getPdo(); echo "ok";',
        ]);
        $this->assertTrue($result->successful(), 'DB facade должен работать в tinker');
    }

    public function test_tc_backend_readme_007_api_prefix(): void
    {
        $apiContent = File::get(base_path('routes/api.php'));
        $this->assertStringContainsString("prefix('v1')", $apiContent);
        $this->getJson('/api/v1/city-list')->assertOk();
    }

    public function test_tc_backend_readme_008_admin_login_available(): void
    {
        $this->get('/admin/login')->assertOk();
    }

    public function test_tc_backend_readme_009_default_admin(): void
    {
        $this->artisan('migrate', ['--force' => true])->assertSuccessful();
        $this->seed(AdminUserSeeder::class);
        $user = MoonshineUser::query()->where('email', 'admin@example.com')->first();
        $this->assertNotNull($user);
    }

    public function test_tc_backend_readme_010_admin_from_env(): void
    {
        $content = File::get(base_path('example.env'));
        $this->assertStringContainsString('MOONSHINE_ADMIN_NAME', $content);
        $this->assertStringContainsString('MOONSHINE_ADMIN_EMAIL', $content);
        $this->assertStringContainsString('MOONSHINE_ADMIN_PASSWORD', $content);
    }
}
