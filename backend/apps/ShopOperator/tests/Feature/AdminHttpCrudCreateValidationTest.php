<?php

declare(strict_types=1);

namespace Tests\Feature;

use ShopOperator\Models\City;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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
        ])->assertStatus(302);

        $this->assertDatabaseMissing('city', ['code' => 'city-invalid']);
    }

    public function test_admin_create_payload_code_is_ignored_in_dictionary_forms(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $invalidCode = 'код.с-пробелом';

        $cases = [
            ['resourceUri' => 'city-resource', 'model' => \ShopOperator\Models\City::class, 'title' => 'City Invalid'],
            ['resourceUri' => 'category-resource', 'model' => \ShopOperator\Models\Category::class, 'title' => 'Category Invalid'],
            ['resourceUri' => 'feature-resource', 'model' => \ShopOperator\Models\Feature::class, 'title' => 'Feature Invalid'],
            ['resourceUri' => 'contact-type-resource', 'model' => \ShopOperator\Models\ContactType::class, 'title' => 'Contact Invalid'],
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

        $shop = \ShopOperator\Models\Shop::query()->where('title', 'Shop Invalid')->firstOrFail();
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
            static fn() => \ShopOperator\Models\City::query()->create([
                'code' => 'код.с-точкой',
                'title' => 'City Model Invalid',
                'sort' => 1,
                'is_published' => true,
            ]),
            static fn() => \ShopOperator\Models\Category::query()->create([
                'code' => 'код.с-точкой',
                'title' => 'Category Model Invalid',
                'sort' => 1,
                'is_published' => true,
            ]),
            static fn() => \ShopOperator\Models\Feature::query()->create([
                'code' => 'код.с-точкой',
                'title' => 'Feature Model Invalid',
                'sort' => 1,
                'is_published' => true,
            ]),
            static fn() => \ShopOperator\Models\ContactType::query()->create([
                'code' => 'код.с-точкой',
                'title' => 'ContactType Model Invalid',
                'sort' => 1,
                'is_published' => true,
            ]),
            static fn() => \ShopOperator\Models\Shop::query()->create([
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
                $this->fail('Expected ValidationException for invalid code.');
            } catch (ValidationException) {
                $this->assertTrue(true);
            }
        }
    }

    public function test_model_save_rejects_empty_title_for_resources_with_code(): void
    {
        $cityForShop = City::query()->create([
            'title' => 'Город Для Проверки Пустого Заголовка',
            'sort' => 1,
            'is_published' => true,
        ]);

        $createCases = [
            static fn() => \ShopOperator\Models\City::query()->create([
                'title' => '   ',
                'sort' => 1,
                'is_published' => true,
            ]),
            static fn() => \ShopOperator\Models\Category::query()->create([
                'title' => '',
                'sort' => 1,
                'is_published' => true,
            ]),
            static fn() => \ShopOperator\Models\Feature::query()->create([
                'title' => '',
                'sort' => 1,
                'is_published' => true,
            ]),
            static fn() => \ShopOperator\Models\ContactType::query()->create([
                'title' => '',
                'sort' => 1,
                'is_published' => true,
            ]),
            static fn() => \ShopOperator\Models\Shop::query()->create([
                'title' => '',
                'sort' => 1,
                'city_id' => $cityForShop->id,
                'is_published' => true,
            ]),
        ];

        foreach ($createCases as $createCase) {
            try {
                $createCase();
                $this->fail('Expected ValidationException for empty title.');
            } catch (ValidationException) {
                $this->assertTrue(true);
            }
        }
    }

    public function test_admin_cannot_create_shop_without_title_or_city_over_http(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $city = City::query()->create([
            'title' => 'Город Для Валидации Магазина',
            'sort' => 1,
            'is_published' => true,
        ]);

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'shop-resource']), [
            'title' => '',
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => '',
            'site_url' => '',
            'is_published' => '1',
            'category_links' => [],
            'feature_links' => [],
            'contact_entries' => [],
            'gallery_entries' => [],
            'schedule_entries' => [],
            'schedule_note_text' => '',
        ])->assertStatus(302);

        $this->assertDatabaseMissing('shop', ['city_id' => $city->getKey(), 'sort' => 1]);

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'shop-resource']), [
            'title' => 'Shop Without City',
            'sort' => 1,
            'city_id' => null,
            'description' => '',
            'site_url' => '',
            'is_published' => '1',
            'category_links' => [],
            'feature_links' => [],
            'contact_entries' => [],
            'gallery_entries' => [],
            'schedule_entries' => [],
            'schedule_note_text' => '',
        ])->assertStatus(302);

        $this->assertDatabaseMissing('shop', ['title' => 'Shop Without City']);
    }

    public function test_shop_city_binding_is_enforced_at_db_level(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            $this->markTestSkipped('DB-level constraint assertion is implemented for sqlite in this test.');
        }

        $tableInfo = DB::select("PRAGMA table_info('shop')");
        $cityColumn = collect($tableInfo)->firstWhere('name', 'city_id');
        $this->assertNotNull($cityColumn);
        $this->assertSame(1, (int) ($cityColumn->notnull ?? 0));

        $fkList = DB::select("PRAGMA foreign_key_list('shop')");
        $hasCityFk = collect($fkList)->contains(
            fn(object $fk): bool => ($fk->from ?? null) === 'city_id'
                && ($fk->table ?? null) === 'city'
                && ($fk->to ?? null) === 'id',
        );

        $this->assertTrue($hasCityFk, 'Expected foreign key shop.city_id -> city.id');
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
