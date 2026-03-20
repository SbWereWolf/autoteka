<?php

declare(strict_types=1);

namespace Tests\Feature\Console;

use Illuminate\Support\Facades\Artisan;
use MoonShine\Laravel\Models\MoonshineUser;
use MoonShine\Laravel\Models\MoonshineUserRole;
use Tests\TestCase;

final class IsThereAnAdminCommandTest extends TestCase
{
    public function test_returns_missing_when_admin_account_does_not_exist(): void
    {
        Artisan::call('migrate:fresh', ['--force' => true]);

        $exitCode = Artisan::call('autoteka:is-there-an-admin', [
            'email' => 'missing-admin@example.com',
        ]);

        $this->assertSame(0, $exitCode);
        $this->assertStringContainsString('missing', Artisan::output());
    }

    public function test_returns_present_when_admin_account_exists(): void
    {
        Artisan::call('migrate:fresh', ['--force' => true]);

        $role = MoonshineUserRole::query()->firstOrCreate(
            ['id' => MoonshineUserRole::DEFAULT_ROLE_ID],
            ['name' => 'Admin'],
        );

        MoonshineUser::query()->create([
            'moonshine_user_role_id' => $role->getKey(),
            'email' => 'present-admin@example.com',
            'name' => 'Present Admin',
            'password' => bcrypt('admin12345'),
        ]);

        $exitCode = Artisan::call('autoteka:is-there-an-admin', [
            'email' => 'present-admin@example.com',
        ]);

        $this->assertSame(4, $exitCode);
        $this->assertStringContainsString('present', Artisan::output());
    }

    public function test_returns_invalid_args_for_empty_email(): void
    {
        $exitCode = Artisan::call('autoteka:is-there-an-admin', [
            'email' => '',
        ]);

        $this->assertSame(2, $exitCode);
    }

    public function test_returns_invalid_args_for_non_email_value(): void
    {
        $exitCode = Artisan::call('autoteka:is-there-an-admin', [
            'email' => 'not-an-email',
        ]);

        $this->assertSame(2, $exitCode);
    }

    public function test_returns_database_unavailable_when_table_is_missing(): void
    {
        $exitCode = Artisan::call('autoteka:is-there-an-admin', [
            'email' => 'admin@example.com',
        ]);

        $this->assertSame(3, $exitCode);
    }
}
