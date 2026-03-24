<?php

declare(strict_types=1);

namespace Tests\Feature;

use ShopOperator\Models\Category;
use ShopOperator\Models\City;
use ShopOperator\Models\ContactType;
use ShopOperator\Models\Feature;
use ShopOperator\Models\Shop;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use MoonShine\Laravel\Models\MoonshineUser;
use MoonShine\Laravel\Models\MoonshineUserRole;
use Tests\TestCase;

final class AdminMoonshineSaveRedirectsAndStressTest extends TestCase
{
    use RefreshDatabase;

    public function test_shop_store_redirects_to_detail_route(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $city = City::query()->create([
            'code' => 'city-redir',
            'title' => 'City Redir',
            'sort' => 1,
            'is_published' => true,
        ]);

        $response = $this->post(route('moonshine.crud.store', ['resourceUri' => 'shop-resource']), [
            'title' => 'Shop Redirect Target',
            'sort' => 20,
            'city_id' => $city->getKey(),
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
        ]);

        $response->assertStatus(302);
        $shop = Shop::query()->where('title', 'Shop Redirect Target')->firstOrFail();
        $location = (string) $response->headers->get('Location');
        self::assertStringContainsString('shop-resource', $location);
        self::assertStringContainsString('detail-page/'.$shop->getKey(), $location);
    }

    public function test_dictionary_store_redirects_to_index_route(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $response = $this->post(route('moonshine.crud.store', ['resourceUri' => 'city-resource']), [
            'title' => 'City Index Redirect',
            'sort' => 15,
            'is_published' => '1',
        ]);

        $response->assertStatus(302);
        $location = (string) $response->headers->get('Location');
        self::assertStringContainsString('city-resource', $location);
        self::assertStringContainsString('index-page', $location);
    }

    public function test_shop_save_rejects_negative_sort_via_handler(): void
    {
        $city = City::query()->create([
            'code' => 'city-sort',
            'title' => 'City Sort',
            'sort' => 1,
            'is_published' => true,
        ]);

        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'shop-resource']), [
            'title' => 'Bad Sort Shop',
            'sort' => -1,
            'city_id' => $city->getKey(),
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

        $this->assertDatabaseMissing('shop', ['title' => 'Bad Sort Shop']);
    }

    public function test_shop_create_with_many_links_succeeds(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $city = City::query()->create([
            'code' => 'city-stress',
            'title' => 'City Stress',
            'sort' => 1,
            'is_published' => true,
        ]);

        $categories = [];
        for ($i = 0; $i < 12; $i++) {
            $categories[] = Category::query()->create([
                'code' => 'cat-stress-'.$i,
                'title' => 'Cat Stress '.$i,
                'sort' => $i,
                'is_published' => true,
            ]);
        }
        $features = [];
        for ($i = 0; $i < 8; $i++) {
            $features[] = Feature::query()->create([
                'code' => 'feat-stress-'.$i,
                'title' => 'Feat Stress '.$i,
                'sort' => $i,
                'is_published' => true,
            ]);
        }
        $type = ContactType::query()->create([
            'code' => 'type-stress',
            'title' => 'Type Stress',
            'sort' => 1,
            'is_published' => true,
        ]);

        $categoryLinks = [];
        foreach ($categories as $c) {
            $categoryLinks[] = ['category_id' => $c->getKey(), 'is_published' => true];
        }
        $featureLinks = [];
        foreach ($features as $f) {
            $featureLinks[] = ['feature_id' => $f->getKey(), 'is_published' => true];
        }

        $contacts = [];
        for ($i = 0; $i < 6; $i++) {
            $contacts[] = [
                'contact_type_id' => $type->getKey(),
                'value' => '+7 900 000 00 0'.$i,
                'sort' => ($i + 1) * 10,
                'is_published' => true,
            ];
        }

        $schedules = [];
        for ($d = 1; $d <= 7; $d++) {
            $schedules[] = [
                'weekday' => $d,
                'time_from' => '09:00',
                'time_to' => '18:00',
                'sort' => $d * 10,
                'is_published' => true,
            ];
        }

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'shop-resource']), [
            'title' => 'Stress Shop',
            'sort' => 50,
            'city_id' => $city->getKey(),
            'description' => str_repeat('Описание. ', 80),
            'site_url' => 'example.com/stress',
            'slogan' => 'Стресс-тест',
            'latitude' => 55.0,
            'longitude' => 83.0,
            'schedule_note' => 'Пн–Вс',
            'is_published' => '1',
            'category_links' => $categoryLinks,
            'feature_links' => $featureLinks,
            'contact_entries' => $contacts,
            'gallery_entries' => [],
            'schedule_entries' => $schedules,
        ])->assertStatus(302);

        $shop = Shop::query()->where('title', 'Stress Shop')->firstOrFail();
        self::assertSame(12, $shop->categories()->count());
        self::assertSame(8, $shop->features()->count());
        self::assertSame(6, $shop->contacts()->count());
        self::assertSame(7, $shop->schedules()->count());
    }

    private function createAdminUser(): MoonshineUser
    {
        $role = MoonshineUserRole::query()->firstOrCreate(
            ['id' => 1],
            ['name' => 'Admin'],
        );

        return MoonshineUser::query()->create([
            'moonshine_user_role_id' => $role->getKey(),
            'email' => 'admin-stress@example.com',
            'name' => 'Admin Stress',
            'password' => bcrypt('admin12345'),
        ]);
    }
}
