<?php

declare(strict_types=1);

namespace Tests\Feature;

use ShopOperator\Models\Feature;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use MoonShine\Laravel\Models\MoonshineUser;
use MoonShine\Laravel\Models\MoonshineUserRole;
use Tests\TestCase;

final class AdminHttpFeatureCrudCycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_feature_full_cycle_create_publish_edit_hide_and_invalid(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'feature-resource']), [
            'code' => 'feature-cycle',
            'title' => 'Feature Cycle',
            'sort' => 10,
            'is_published' => '0',
        ])->assertStatus(302);

        $feature = Feature::query()->where('code', 'feature-cycle')->firstOrFail();
        $this->assertSame(0, (int) $feature->is_published);

        $this->patch(route('moonshine.crud.update', [
            'resourceUri' => 'feature-resource',
            'resourceItem' => $feature->id,
        ]), [
            'code' => 'feature-cycle',
            'title' => 'Feature Cycle',
            'sort' => 10,
            'is_published' => '1',
        ])->assertStatus(302);
        $this->assertDatabaseHas('feature', [
            'id' => $feature->id,
            'is_published' => 1,
        ]);

        $this->patch(route('moonshine.crud.update', [
            'resourceUri' => 'feature-resource',
            'resourceItem' => $feature->id,
        ]), [
            'code' => 'feature-cycle-updated',
            'title' => 'Feature Cycle Updated',
            'sort' => 99,
            'is_published' => '1',
        ])->assertStatus(302);
        $this->assertDatabaseHas('feature', [
            'id' => $feature->id,
            'code' => 'feature-cycle',
            'title' => 'Feature Cycle Updated',
            'sort' => 99,
            'is_published' => 1,
        ]);
        $this->assertDatabaseMissing('feature', [
            'id' => $feature->id,
            'code' => 'feature-cycle-updated',
        ]);

        $this->patch(route('moonshine.crud.update', [
            'resourceUri' => 'feature-resource',
            'resourceItem' => $feature->id,
        ]), [
            'code' => 'feature-cycle-updated',
            'title' => 'Feature Cycle Updated',
            'sort' => 99,
            'is_published' => '0',
        ])->assertStatus(302);
        $this->assertDatabaseHas('feature', [
            'id' => $feature->id,
            'is_published' => 0,
        ]);

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'feature-resource']), [
            'code' => 'feature-cycle-invalid',
            'title' => '',
            'sort' => 5,
            'is_published' => '1',
        ])->assertStatus(302);
        $this->assertDatabaseMissing('feature', ['code' => 'feature-cycle-invalid']);
    }

    private function createAdminUser(): MoonshineUser
    {
        $role = MoonshineUserRole::query()->firstOrCreate(
            ['id' => MoonshineUserRole::DEFAULT_ROLE_ID],
            ['name' => 'Admin'],
        );

        return MoonshineUser::query()->create([
            'moonshine_user_role_id' => $role->getKey(),
            'email' => 'admin-feature-cycle@example.com',
            'name' => 'Admin Feature Cycle',
            'password' => bcrypt('admin12345'),
        ]);
    }
}
