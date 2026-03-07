<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TcReadme007Test extends TestCase
{
    use RefreshDatabase;

    public function test_admin_login_route_returns_200(): void
    {
        $response = $this->get('/admin/login');
        $response->assertOk();
        $response->assertStatus(200);
    }
}
