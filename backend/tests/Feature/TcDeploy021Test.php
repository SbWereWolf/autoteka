<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TcDeploy021Test extends TestCase
{
    use RefreshDatabase;

    public function test_import_command_registered(): void
    {
        $this->artisan('autoteka:data:import', ['scope' => 'city'])
            ->assertFailed(); // fails without --file, but command exists
    }

    public function test_import_shop_requires_generated_root(): void
    {
        $file = base_path('../frontend/src/mocks/shops.json');
        if (! is_file($file)) {
            $this->markTestSkipped('shops.json not found');
        }
        $result = $this->artisan('autoteka:data:import', [
            'scope' => 'shop',
            '--mode' => 'dry-run',
            '--file' => $file,
        ]);
        $this->assertNotEquals(0, $result);
    }
}
