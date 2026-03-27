<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use MoonShine\Laravel\Models\MoonshineUser;
use MoonShine\Laravel\Models\MoonshineUserRole;
use ShopOperator\Models\City;
use ShopOperator\Models\Shop;
use Tests\TestCase;

final class PromotionAdminHttpFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_promotion_index_hides_create_action_and_delete_actions(): void
    {
        $this->actingAs($this->createAdminUser(), 'moonshine');

        $response = $this->get(route('moonshine.crud.index', [
            'resourceUri' => 'promotion-resource',
        ]));

        $response->assertOk();
        $response->assertDontSee('Добавить рекламную акцию');
        $response->assertDontSee('Создать');
        $response->assertDontSee('Удалить');
    }

    public function test_shop_detail_page_exposes_top_create_promotion_button_without_preview_block(): void
    {
        $this->actingAs($this->createAdminUser(), 'moonshine');
        $shop = $this->createShop('promo-http-shop', 'Promo HTTP Shop');

        $response = $this->get(route('moonshine.resource.page', [
            'resourceUri' => 'shop-resource',
            'pageUri' => 'detail-page',
            'resourceItem' => $shop->getKey(),
        ]));

        $response->assertOk();
        $response->assertSeeText('Создать рекламную акцию');
        $response->assertDontSeeText('Создание рекламной акции');
        $response->assertDontSeeText('Добавить рекламную акцию');
    }

    public function test_top_buttons_detail_page_routes_do_not_exist_anymore(): void
    {
        $this->actingAs($this->createAdminUser(), 'moonshine');
        $shop = $this->createShop('promo-http-shop-404', 'Promo HTTP Shop 404');

        $response = $this->get('/admin/resource/shop-resource/top-buttons-detail-page/'.$shop->getKey());

        $response->assertNotFound();
    }

    public function test_shop_detail_page_renders_edit_button_before_detail_content(): void
    {
        $this->actingAs($this->createAdminUser(), 'moonshine');
        $shop = $this->createShop('promo-shop-top-edit', 'Promo Shop Top Edit');

        $response = $this->get(route('moonshine.resource.page', [
            'resourceUri' => 'shop-resource',
            'pageUri' => 'detail-page',
            'resourceItem' => $shop->getKey(),
        ]));

        $response->assertOk();

        $body = $response->getContent();
        self::assertNotFalse(strpos($body, 'js-edit-button'));
        self::assertNotFalse(strpos($body, 'crud-detail'));
        self::assertTrue(
            strpos($body, 'js-edit-button') < strpos($body, 'crud-detail'),
            'Expected the shop detail edit button to render before the detail content.',
        );
    }

    public function test_shop_detail_button_creates_draft_promotion_and_redirects_to_edit_page(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $this->actingAs($this->createAdminUser(), 'moonshine');
        $shop = $this->createShop('promo-store-shop', 'Promo Store Shop');

        $before = now()->addDays(7);

        $storeResponse = $this->post(route('shop-operator.promotions.create-draft', [
            'shop' => $shop->getKey(),
        ]));

        $storeResponse->assertStatus(302);
        $promotion = DB::table('promotion')->where('shop_id', $shop->getKey())->latest('id')->first();
        self::assertNotNull($promotion);

        $storeResponse->assertRedirect(route('moonshine.crud.edit', [
            'resourceUri' => 'promotion-resource',
            'resourceItem' => $promotion->id,
        ]));

        self::assertStringStartsWith('promo-store-shop-', (string) $promotion->code);
        self::assertSame('рекламная акция Promo Store Shop', $promotion->description);
        self::assertSame(0, (int) $promotion->is_published);
        self::assertSame($before->toDateString(), (string) $promotion->start_date);
        self::assertSame($before->toDateString(), (string) $promotion->end_date);
        self::assertMatchesRegularExpression(
            '/^Promo Store Shop \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/',
            (string) $promotion->title,
        );
    }

    public function test_editing_promotion_recalculates_code_when_title_changes(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $this->actingAs($this->createAdminUser(), 'moonshine');
        $shop = $this->createShop('promo-edit-shop', 'Promo Edit Shop');

        $this->post(route('shop-operator.promotions.create-draft', [
            'shop' => $shop->getKey(),
        ]))->assertStatus(302);

        $promotion = DB::table('promotion')->where('shop_id', $shop->getKey())->latest('id')->first();
        self::assertNotNull($promotion);

        $this->patch(route('moonshine.crud.update', [
            'resourceUri' => 'promotion-resource',
            'resourceItem' => $promotion->id,
        ]), [
            '_method' => 'PATCH',
            'title' => 'Spring Sale',
            'description' => 'Spring sale description',
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-15',
            'is_published' => '0',
        ])->assertStatus(302);

        $updatedPromotion = DB::table('promotion')->where('id', $promotion->id)->first();
        self::assertNotNull($updatedPromotion);
        self::assertSame('promo-edit-shop-spring-sale', $updatedPromotion->code);
    }

    public function test_promotion_form_shows_shop_as_city_colon_shop_and_does_not_allow_editing_binding(): void
    {
        $this->actingAs($this->createAdminUser(), 'moonshine');
        $shop = $this->createShop('promo-binding-shop', 'Promo Binding Shop');

        $this->post(route('shop-operator.promotions.create-draft', [
            'shop' => $shop->getKey(),
        ]))->assertStatus(302);

        $promotion = DB::table('promotion')->where('shop_id', $shop->getKey())->latest('id')->first();
        self::assertNotNull($promotion);

        $response = $this->get(route('moonshine.crud.edit', [
            'resourceUri' => 'promotion-resource',
            'resourceItem' => $promotion->id,
        ]));

        $response->assertOk();
        $response->assertSeeText($shop->city?->title . ': ' . $shop->title);
        $response->assertDontSee('Магазин (код)');
        $response->assertDontSee('Магазин (название)');
        $response->assertDontSee('name="shop_id"', false);
    }

    public function test_promotion_detail_page_renders_edit_button_before_detail_content(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $this->actingAs($this->createAdminUser(), 'moonshine');
        $shop = $this->createShop('promo-top-edit', 'Promo Top Edit');

        $this->post(route('shop-operator.promotions.create-draft', [
            'shop' => $shop->getKey(),
        ]))->assertStatus(302);

        $promotion = DB::table('promotion')->where('shop_id', $shop->getKey())->latest('id')->first();
        self::assertNotNull($promotion);

        $response = $this->get(route('moonshine.resource.page', [
            'resourceUri' => 'promotion-resource',
            'pageUri' => 'detail-page',
            'resourceItem' => $promotion->id,
        ]));

        $response->assertOk();

        $body = $response->getContent();
        self::assertNotFalse(strpos($body, 'js-edit-button'));
        self::assertNotFalse(strpos($body, 'crud-detail'));
        self::assertTrue(
            strpos($body, 'js-edit-button') < strpos($body, 'crud-detail'),
            'Expected the promotion detail edit button to render before the detail content.',
        );
    }

    public function test_shop_detail_page_lists_future_and_active_promotions_in_expected_order(): void
    {
        $this->actingAs($this->createAdminUser(), 'moonshine');
        $shop = $this->createShop('promo-order-shop', 'Promo Order Shop');
        $today = now()->toDateString();

        DB::table('promotion')->insert([
            [
                'shop_id' => $shop->getKey(),
                'code' => 'promo-order-shop-future-published-a',
                'title' => 'Future Published A',
                'description' => 'Future published A',
                'start_date' => now()->addDays(4)->toDateString(),
                'end_date' => now()->addDays(9)->toDateString(),
                'is_published' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'shop_id' => $shop->getKey(),
                'code' => 'promo-order-shop-future-published-b',
                'title' => 'Future Published B',
                'description' => 'Future published B',
                'start_date' => now()->addDays(4)->toDateString(),
                'end_date' => now()->addDays(9)->toDateString(),
                'is_published' => 1,
                'created_at' => now()->addSecond(),
                'updated_at' => now()->addSecond(),
            ],
            [
                'shop_id' => $shop->getKey(),
                'code' => 'promo-order-shop-future-hidden',
                'title' => 'Future Hidden',
                'description' => 'Future hidden',
                'start_date' => now()->addDays(4)->toDateString(),
                'end_date' => now()->addDays(9)->toDateString(),
                'is_published' => 0,
                'created_at' => now()->addSeconds(2),
                'updated_at' => now()->addSeconds(2),
            ],
            [
                'shop_id' => $shop->getKey(),
                'code' => 'promo-order-shop-active-published',
                'title' => 'Active Published',
                'description' => 'Active published',
                'start_date' => now()->subDay()->toDateString(),
                'end_date' => now()->addDays(2)->toDateString(),
                'is_published' => 1,
                'created_at' => now()->addSeconds(3),
                'updated_at' => now()->addSeconds(3),
            ],
            [
                'shop_id' => $shop->getKey(),
                'code' => 'promo-order-shop-active-hidden',
                'title' => 'Active Hidden',
                'description' => 'Active hidden',
                'start_date' => now()->subDay()->toDateString(),
                'end_date' => now()->addDays(2)->toDateString(),
                'is_published' => 0,
                'created_at' => now()->addSeconds(4),
                'updated_at' => now()->addSeconds(4),
            ],
            [
                'shop_id' => $shop->getKey(),
                'code' => 'promo-order-shop-expired',
                'title' => 'Expired',
                'description' => 'Expired',
                'start_date' => now()->subDays(10)->toDateString(),
                'end_date' => now()->subDays(2)->toDateString(),
                'is_published' => 1,
                'created_at' => now()->addSeconds(5),
                'updated_at' => now()->addSeconds(5),
            ],
        ]);

        $response = $this->get(route('moonshine.resource.page', [
            'resourceUri' => 'shop-resource',
            'pageUri' => 'detail-page',
            'resourceItem' => $shop->getKey(),
        ]));

        $response->assertOk();
        $response->assertSeeText('Future Published A');
        $response->assertSeeText('Future Published B');
        $response->assertSeeText('Future Hidden');
        $response->assertSeeText('Active Published');
        $response->assertSeeText('Active Hidden');
        $response->assertDontSeeText('Expired');

        $body = $response->getContent();
        self::assertNotFalse(strpos($body, 'Future Published A'));
        self::assertNotFalse(strpos($body, 'Future Published B'));
        self::assertNotFalse(strpos($body, 'Future Hidden'));
        self::assertNotFalse(strpos($body, 'Active Published'));
        self::assertNotFalse(strpos($body, 'Active Hidden'));
        self::assertTrue(
            strpos($body, 'Future Published A') < strpos($body, 'Future Published B')
                && strpos($body, 'Future Published B') < strpos($body, 'Future Hidden')
                && strpos($body, 'Future Hidden') < strpos($body, 'Active Published')
                && strpos($body, 'Active Published') < strpos($body, 'Active Hidden'),
            'Expected promotions to be rendered with future promotions first, then active promotions.',
        );
        self::assertStringNotContainsString(
            now()->addDays(4)->toDateString().' 00:00:00',
            $body,
            'Promotion dates in the shop table must be rendered without time.',
        );
        self::assertNotFalse(
            strpos($body, 'js-detail-button'),
            'Expected promotion rows to use the standard MoonShine detail button.',
        );
    }

    public function test_shop_form_page_marks_repeaters_for_left_aligned_remove_buttons(): void
    {
        $this->actingAs($this->createAdminUser(), 'moonshine');
        $shop = $this->createShop('promo-form-shop', 'Promo Form Shop');

        $response = $this->get(route('moonshine.resource.page', [
            'resourceUri' => 'shop-resource',
            'pageUri' => 'form-page',
            'resourceItem' => $shop->getKey(),
        ]));

        $response->assertOk();
        $response->assertSee('shop-form-repeaters-remove-left', false);
    }

    private function createAdminUser(): MoonshineUser
    {
        $role = MoonshineUserRole::query()->firstOrCreate(
            ['id' => MoonshineUserRole::DEFAULT_ROLE_ID],
            ['name' => 'Admin'],
        );

        return MoonshineUser::query()->create([
            'moonshine_user_role_id' => $role->getKey(),
            'email' => 'admin-promotion@example.com',
            'name' => 'Admin Promotion',
            'password' => bcrypt('admin12345'),
        ]);
    }

    private function createShop(string $code, string $title): Shop
    {
        $city = City::query()->create([
            'code' => $code.'-city',
            'title' => $title.' City',
            'sort' => 1,
            'is_published' => true,
        ]);

        return Shop::query()->create([
            'code' => $code,
            'title' => $title,
            'sort' => 1,
            'city_id' => $city->getKey(),
            'description' => '',
            'site_url' => '',
            'slogan' => null,
            'latitude' => null,
            'longitude' => null,
            'schedule_note' => null,
            'thumb_path' => null,
            'is_published' => true,
        ]);
    }
}
