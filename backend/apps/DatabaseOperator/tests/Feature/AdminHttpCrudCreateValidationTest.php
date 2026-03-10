<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\City;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use MoonShine\Laravel\Models\MoonshineUser;
use MoonShine\Laravel\Models\MoonshineUserRole;
use Tests\TestCase;

final class AdminHttpCrudCreateValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_dictionary_resources_over_http(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'city-resource']), [
            'code' => 'city-new',
            'title' => 'City New',
            'sort' => 10,
            'is_published' => '1',
        ])->assertStatus(302);

        $this->assertDatabaseHas('city', ['code' => 'city-new', 'title' => 'City New']);
    }

    public function test_admin_can_create_city_without_code_and_get_russian_slug(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'city-resource']), [
            'title' => 'Тестовый Город 2026',
            'sort' => 11,
            'is_published' => '1',
        ])->assertStatus(302);

        $city = City::query()->where('title', 'Тестовый Город 2026')->firstOrFail();
        $this->assertMatchesRegularExpression('/^[A-Za-z0-9_-]+$/', $city->code);
    }

    public function test_admin_cannot_create_city_without_title_over_http(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'city-resource']), [
            'code' => 'city-invalid',
            'title' => '',
            'sort' => 1,
            'is_published' => '1',
        ])->assertStatus(500);

        $this->assertDatabaseMissing('city', ['code' => 'city-invalid']);
    }

    public function test_admin_create_payload_code_is_ignored_in_dictionary_forms(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $invalidCode = 'код.с-пробелом';

        $cases = [
            ['resourceUri' => 'city-resource', 'model' => \App\Models\City::class, 'title' => 'City Invalid'],
            ['resourceUri' => 'category-resource', 'model' => \App\Models\Category::class, 'title' => 'Category Invalid'],
            ['resourceUri' => 'feature-resource', 'model' => \App\Models\Feature::class, 'title' => 'Feature Invalid'],
            ['resourceUri' => 'contact-type-resource', 'model' => \App\Models\ContactType::class, 'title' => 'Contact Invalid'],
        ];

        foreach ($cases as $case) {
            $this->post(route('moonshine.crud.store', ['resourceUri' => $case['resourceUri']]), [
                'code' => $invalidCode,
                'title' => $case['title'],
                'sort' => 1,
                'is_published' => '1',
            ])->assertStatus(302);

            $model = $case['model']::query()->where('title', $case['title'])->firstOrFail();
            $this->assertNotSame($invalidCode, $model->code);
            $this->assertMatchesRegularExpression('/^[A-Za-z0-9_-]+$/', $model->code);
        }
    }

    public function test_admin_can_create_shop_over_http_with_minimal_valid_payload(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $city = City::query()->create([
            'code' => 'city-for-shop',
            'title' => 'City For Shop',
            'sort' => 1,
            'is_published' => true,
        ]);

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'shop-resource']), [
            'code' => 'shop-create',
            'title' => 'Shop Create',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => 'Created in HTTP test',
            'site_url' => 'https://example.com/shop-create',
            'is_published' => '1',
            'category_links' => [],
            'feature_links' => [],
            'contact_entries' => [],
            'gallery_entries' => [],
            'schedule_entries' => [],
            'schedule_note_text' => '',
        ])->assertStatus(302);

        $this->assertDatabaseHas('shop', [
            'code' => 'shop-create',
            'title' => 'Shop Create',
            'city_id' => $city->getKey(),
            'is_published' => 1,
        ]);
    }

    public function test_admin_create_payload_code_is_ignored_in_shop_form(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $city = City::query()->create([
            'title' => 'Город Для Невалидного Магазина',
            'sort' => 1,
            'is_published' => true,
        ]);

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'shop-resource']), [
            'code' => 'магазин.тест',
            'title' => 'Shop Invalid',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => 'Created in HTTP test',
            'site_url' => 'https://example.com/shop-invalid',
            'is_published' => '1',
            'category_links' => [],
            'feature_links' => [],
            'contact_entries' => [],
            'gallery_entries' => [],
            'schedule_entries' => [],
            'schedule_note_text' => '',
        ])->assertStatus(302);

        $shop = \App\Models\Shop::query()->where('title', 'Shop Invalid')->firstOrFail();
        $this->assertMatchesRegularExpression('/^[A-Za-z0-9_-]+$/', $shop->code);
    }

    public function test_model_save_rejects_invalid_code_for_all_resources(): void
    {
        $cityForShop = City::query()->create([
            'title' => 'Город Для Проверки Кода',
            'sort' => 1,
            'is_published' => true,
        ]);

        $createCases = [
            static fn() => \App\Models\City::query()->create([
                'code' => 'код.с-точкой',
                'title' => 'City Model Invalid',
                'sort' => 1,
                'is_published' => true,
            ]),
            static fn() => \App\Models\Category::query()->create([
                'code' => 'код.с-точкой',
                'title' => 'Category Model Invalid',
                'sort' => 1,
                'is_published' => true,
            ]),
            static fn() => \App\Models\Feature::query()->create([
                'code' => 'код.с-точкой',
                'title' => 'Feature Model Invalid',
                'sort' => 1,
                'is_published' => true,
            ]),
            static fn() => \App\Models\ContactType::query()->create([
                'code' => 'код.с-точкой',
                'title' => 'ContactType Model Invalid',
                'sort' => 1,
                'is_published' => true,
            ]),
            static fn() => \App\Models\Shop::query()->create([
                'code' => 'код.с-точкой',
                'title' => 'Shop Model Invalid',
                'sort' => 1,
                'city_id' => $cityForShop->id,
                'is_published' => true,
            ]),
        ];

        foreach ($createCases as $createCase) {
            try {
                $createCase();
                $this->fail('Expected InvalidArgumentException for invalid code.');
            } catch (\InvalidArgumentException) {
                $this->assertTrue(true);
            }
        }
    }

    private function createAdminUser(): MoonshineUser
    {
        $role = MoonshineUserRole::query()->firstOrCreate(
            ['id' => 1],
            ['name' => 'Admin'],
        );

        return MoonshineUser::query()->create([
            'moonshine_user_role_id' => $role->getKey(),
            'email' => 'admin-create-http@example.com',
            'name' => 'Admin Create HTTP',
            'password' => bcrypt('admin12345'),
        ]);
    }
}
