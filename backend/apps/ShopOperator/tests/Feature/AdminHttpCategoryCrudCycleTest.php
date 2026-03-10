<?php

declare(strict_types=1);

namespace Tests\Feature;

use ShopOperator\Models\Category;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use MoonShine\Laravel\Models\MoonshineUser;
use MoonShine\Laravel\Models\MoonshineUserRole;
use Tests\TestCase;

final class AdminHttpCategoryCrudCycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_category_full_cycle_create_publish_edit_hide_and_invalid(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'category-resource']), [
            'code' => 'category-cycle',
            'title' => 'Category Cycle',
            'sort' => 10,
            'is_published' => '0',
        ])->assertStatus(302);

        $category = Category::query()->where('code', 'category-cycle')->firstOrFail();
        $this->assertSame(0, (int) $category->is_published);

        $this->patch(route('moonshine.crud.update', [
            'resourceUri' => 'category-resource',
            'resourceItem' => $category->id,
        ]), [
            'code' => 'category-cycle',
            'title' => 'Category Cycle',
            'sort' => 10,
            'is_published' => '1',
        ])->assertStatus(302);
        $this->assertDatabaseHas('category', [
            'id' => $category->id,
            'is_published' => 1,
        ]);

        $this->patch(route('moonshine.crud.update', [
            'resourceUri' => 'category-resource',
            'resourceItem' => $category->id,
        ]), [
            'code' => 'category-cycle-updated',
            'title' => 'Category Cycle Updated',
            'sort' => 99,
            'is_published' => '1',
        ])->assertStatus(302);
        $this->assertDatabaseHas('category', [
            'id' => $category->id,
            'code' => 'category-cycle',
            'title' => 'Category Cycle Updated',
            'sort' => 99,
            'is_published' => 1,
        ]);
        $this->assertDatabaseMissing('category', [
            'id' => $category->id,
            'code' => 'category-cycle-updated',
        ]);

        $this->patch(route('moonshine.crud.update', [
            'resourceUri' => 'category-resource',
            'resourceItem' => $category->id,
        ]), [
            'code' => 'category-cycle-updated',
            'title' => 'Category Cycle Updated',
            'sort' => 99,
            'is_published' => '0',
        ])->assertStatus(302);
        $this->assertDatabaseHas('category', [
            'id' => $category->id,
            'is_published' => 0,
        ]);

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'category-resource']), [
            'code' => 'category-cycle-invalid',
            'title' => '',
            'sort' => 5,
            'is_published' => '1',
        ])->assertStatus(302);
        $this->assertDatabaseMissing('category', ['code' => 'category-cycle-invalid']);
    }

    private function createAdminUser(): MoonshineUser
    {
        $role = MoonshineUserRole::query()->firstOrCreate(
            ['id' => MoonshineUserRole::DEFAULT_ROLE_ID],
            ['name' => 'Admin'],
        );

        return MoonshineUser::query()->create([
            'moonshine_user_role_id' => $role->getKey(),
            'email' => 'admin-category-cycle@example.com',
            'name' => 'Admin Category Cycle',
            'password' => bcrypt('admin12345'),
        ]);
    }
}
