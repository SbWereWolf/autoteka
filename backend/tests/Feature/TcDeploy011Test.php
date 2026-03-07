<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TcDeploy011Test extends TestCase
{
    use RefreshDatabase;

    public function test_migrate_rollback_migrate_cycle(): void
    {
        $this->artisan('migrate', ['--force' => true])->assertSuccessful();
        $this->artisan('migrate:rollback', ['--force' => true])->assertSuccessful();
        $this->artisan('migrate', ['--force' => true])->assertSuccessful();
    }
}
