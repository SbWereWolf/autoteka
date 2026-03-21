<?php

declare(strict_types=1);

namespace Tests\Feature;

use ShopOperator\Models\City;
use ShopOperator\Models\Shop;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use MoonShine\Laravel\Models\MoonshineUser;
use MoonShine\Laravel\Models\MoonshineUserRole;
use Tests\TestCase;

final class AdminHttpPublishHideCycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_publish_and_hide_dictionary_resources_over_http(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $city = City::query()->create([
            'code' => 'city-publish',
            'title' => 'City Publish',
            'sort' => 1,
            'is_published' => false,
        ]);
        $this->toggleDictionaryResource('city-resource', $city->id, true);

        $this->assertDatabaseHas('city', ['id' => $city->id, 'is_published' => 1]);

        $this->toggleDictionaryResource('city-resource', $city->id, false);

        $this->assertDatabaseHas('city', ['id' => $city->id, 'is_published' => 0]);
    }

    public function test_admin_can_publish_and_hide_shop_over_http(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $city = City::query()->create([
            'code' => 'city-shop-toggle',
            'title' => 'City Shop Toggle',
            'sort' => 1,
            'is_published' => true,
        ]);

        $shop = Shop::query()->create([
            'code' => 'shop-toggle',
            'title' => 'Shop Toggle',
            'sort' => 1,
            'city_id' => $city->id,
            'slogan' => null,
            'latitude' => null,
            'longitude' => null,
            'schedule_note' => null,
            'is_published' => false,
        ]);

        $this->post(route('moonshine.crud.update', [
            'resourceUri' => 'shop-resource',
            'resourceItem' => $shop->id,
        ]), [
            '_method' => 'PATCH',
            'code' => 'shop-toggle',
            'title' => 'Shop Toggle',
            'sort' => 1,
            'city_id' => $city->id,
            'description' => '',
            'site_url' => '',
            'slogan' => null,
            'latitude' => null,
            'longitude' => null,
            'schedule_note' => '',
            'is_published' => '1',
            'category_links' => [],
            'feature_links' => [],
            'contact_entries' => [],
            'gallery_entries' => [],
            'schedule_entries' => [],
        ])->assertStatus(302);

        $this->assertDatabaseHas('shop', ['id' => $shop->id, 'is_published' => 1]);

        $this->post(route('moonshine.crud.update', [
            'resourceUri' => 'shop-resource',
            'resourceItem' => $shop->id,
        ]), [
            '_method' => 'PATCH',
            'code' => 'shop-toggle',
            'title' => 'Shop Toggle',
            'sort' => 1,
            'city_id' => $city->id,
            'description' => '',
            'site_url' => '',
            'slogan' => null,
            'latitude' => null,
            'longitude' => null,
            'schedule_note' => '',
            'is_published' => '0',
            'category_links' => [],
            'feature_links' => [],
            'contact_entries' => [],
            'gallery_entries' => [],
            'schedule_entries' => [],
        ])->assertStatus(302);

        $this->assertDatabaseHas('shop', ['id' => $shop->id, 'is_published' => 0]);
    }

    public function test_admin_cannot_create_shop_without_city_over_http(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'shop-resource']), [
            'code' => 'shop-invalid-no-city',
            'title' => 'Shop Invalid',
            'sort' => 1,
            'city_id' => null,
            'description' => '',
            'site_url' => '',
            'slogan' => null,
            'latitude' => null,
            'longitude' => null,
            'schedule_note' => '',
            'is_published' => '1',
            'category_links' => [],
            'feature_links' => [],
            'contact_entries' => [],
            'gallery_entries' => [],
            'schedule_entries' => [],
        ])->assertStatus(302);

        $this->assertDatabaseMissing('shop', ['code' => 'shop-invalid-no-city']);
    }

    private function toggleDictionaryResource(string $resourceUri, int $id, bool $published): void
    {
        $this->patch(route('moonshine.crud.update', [
            'resourceUri' => $resourceUri,
            'resourceItem' => $id,
        ]), [
            'code' => $resourceUri . '-' . $id,
            'title' => strtoupper($resourceUri) . '-' . $id,
            'sort' => 1,
            'is_published' => $published ? '1' : '0',
        ])->assertStatus(302);
    }

    private function createAdminUser(): MoonshineUser
    {
        $role = MoonshineUserRole::query()->firstOrCreate(
            ['id' => MoonshineUserRole::DEFAULT_ROLE_ID],
            ['name' => 'Admin'],
        );

        return MoonshineUser::query()->create([
            'moonshine_user_role_id' => $role->getKey(),
            'email' => 'admin-publish-cycle@example.com',
            'name' => 'Admin Publish Cycle',
            'password' => bcrypt('admin12345'),
        ]);
    }
}
