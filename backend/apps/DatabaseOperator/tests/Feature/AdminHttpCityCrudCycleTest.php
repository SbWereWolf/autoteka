<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\City;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use MoonShine\Laravel\Models\MoonshineUser;
use MoonShine\Laravel\Models\MoonshineUserRole;
use Tests\TestCase;

final class AdminHttpCityCrudCycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_city_full_cycle_create_publish_edit_hide_and_invalid(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'city-resource']), [
            'code' => 'city-cycle',
            'title' => 'City Cycle',
            'sort' => 10,
            'is_published' => '0',
        ])->assertStatus(302);

        $city = City::query()->where('code', 'city-cycle')->firstOrFail();
        $this->assertSame(0, (int) $city->is_published);

        $this->patch(route('moonshine.crud.update', [
            'resourceUri' => 'city-resource',
            'resourceItem' => $city->id,
        ]), [
            'code' => 'city-cycle',
            'title' => 'City Cycle',
            'sort' => 10,
            'is_published' => '1',
        ])->assertStatus(302);
        $this->assertDatabaseHas('city', [
            'id' => $city->id,
            'is_published' => 1,
        ]);

        $this->patch(route('moonshine.crud.update', [
            'resourceUri' => 'city-resource',
            'resourceItem' => $city->id,
        ]), [
            'code' => 'city-cycle-updated',
            'title' => 'City Cycle Updated',
            'sort' => 99,
            'is_published' => '1',
        ])->assertStatus(302);
        $this->assertDatabaseHas('city', [
            'id' => $city->id,
            'code' => 'city-cycle-updated',
            'title' => 'City Cycle Updated',
            'sort' => 99,
            'is_published' => 1,
        ]);

        $this->patch(route('moonshine.crud.update', [
            'resourceUri' => 'city-resource',
            'resourceItem' => $city->id,
        ]), [
            'code' => 'city-cycle-updated',
            'title' => 'City Cycle Updated',
            'sort' => 99,
            'is_published' => '0',
        ])->assertStatus(302);
        $this->assertDatabaseHas('city', [
            'id' => $city->id,
            'is_published' => 0,
        ]);

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'city-resource']), [
            'code' => 'city-cycle-invalid',
            'title' => '',
            'sort' => 5,
            'is_published' => '1',
        ])->assertStatus(500);
        $this->assertDatabaseMissing('city', ['code' => 'city-cycle-invalid']);
    }

    private function createAdminUser(): MoonshineUser
    {
        $role = MoonshineUserRole::query()->firstOrCreate(
            ['id' => MoonshineUserRole::DEFAULT_ROLE_ID],
            ['name' => 'Admin']
        );

        return MoonshineUser::query()->create([
            'moonshine_user_role_id' => $role->getKey(),
            'email' => 'admin-city-cycle@example.com',
            'name' => 'Admin City Cycle',
            'password' => bcrypt('admin12345'),
        ]);
    }
}

