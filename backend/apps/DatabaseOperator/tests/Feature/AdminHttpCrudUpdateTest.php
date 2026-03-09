<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\City;
use App\Models\ContactType;
use App\Models\Feature;
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

        $this->assertHttpUpdateDictionaryResource(City::query()->create([
            'code' => 'city-old',
            'title' => 'City Old',
            'sort' => 1,
            'is_published' => true,
        ]), 'city-resource', 'city-new');

        $this->assertHttpUpdateDictionaryResource(Category::query()->create([
            'code' => 'category-old',
            'title' => 'Category Old',
            'sort' => 1,
            'is_published' => true,
        ]), 'category-resource', 'category-new');

        $this->assertHttpUpdateDictionaryResource(Feature::query()->create([
            'code' => 'feature-old',
            'title' => 'Feature Old',
            'sort' => 1,
            'is_published' => true,
        ]), 'feature-resource', 'feature-new');

        $this->assertHttpUpdateDictionaryResource(ContactType::query()->create([
            'code' => 'contact-old',
            'title' => 'Contact Old',
            'sort' => 1,
            'is_published' => true,
        ]), 'contact-type-resource', 'contact-new');
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

    private function assertHttpUpdateDictionaryResource(object $item, string $resourceUri, string $codePrefix): void
    {
        $response = $this->patch(
            route('moonshine.crud.update', [
                'resourceUri' => $resourceUri,
                'resourceItem' => $item->id,
            ]),
            [
                'code' => $codePrefix,
                'title' => strtoupper($codePrefix),
                'sort' => 99,
                'is_published' => '0',
            ]
        );

        $response->assertStatus(302);

        $this->assertDatabaseHas($item->getTable(), [
            'id' => $item->id,
            'code' => $codePrefix,
            'title' => strtoupper($codePrefix),
            'sort' => 99,
            'is_published' => 0,
        ]);
    }
}

