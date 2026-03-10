<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\City;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use MoonShine\Laravel\Models\MoonshineUser;
use MoonShine\Laravel\Models\MoonshineUserRole;
use Tests\TestCase;

final class AdminHttpCrudUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_dictionary_resources_over_http(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);

        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $city = City::query()->create([
            'code' => 'city-old',
            'title' => 'City Old',
            'sort' => 1,
            'is_published' => true,
        ]);

        $this->patch(
            route('moonshine.crud.update', [
                'resourceUri' => 'city-resource',
                'resourceItem' => $city->id,
            ]),
            [
                'code' => 'city-new',
                'title' => 'CITY-NEW',
                'sort' => 99,
                'is_published' => '0',
            ]
        )->assertStatus(302);

        $this->assertDatabaseHas('city', [
            'id' => $city->id,
            'code' => 'city-new',
            'title' => 'CITY-NEW',
            'sort' => 99,
            'is_published' => 0,
        ]);
    }

    private function createAdminUser(): MoonshineUser
    {
        $role = MoonshineUserRole::query()->firstOrCreate(
            ['id' => MoonshineUserRole::DEFAULT_ROLE_ID],
            ['name' => 'Admin']
        );

        return MoonshineUser::query()->create([
            'moonshine_user_role_id' => $role->getKey(),
            'email' => 'admin-http@example.com',
            'name' => 'Admin HTTP',
            'password' => bcrypt('admin12345'),
        ]);
    }
}
