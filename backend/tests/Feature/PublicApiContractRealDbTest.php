<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use PHPUnit\Framework\Attributes\Group;
use Tests\TestCase;

#[Group('realdb')]
class PublicApiContractRealDbTest extends TestCase
{
    use DatabaseTransactions;

    private const CITY_COUNT = 3;

    private const CITY_CODE = 'barnaul';

    private const CITY_TITLE = 'Барнаул';

    private const CITY_ITEMS_COUNT = 17;

    private const FIRST_CITY_ITEM_CODE = 'barnaul-01';

    private const FIRST_CITY_ITEM_TITLE = 'АвтоПрайм';

    private const SHOP_CODE = 'barnaul-04';

    private const SHOP_TITLE = 'Шины&Диски';

    private const SHOP_WORK_HOURS = 'Ежедневно 10:00–20:00';

    private const SHOP_THUMB_PATH_SUFFIX = '/storage/shops/thumbs/gen-3x2-x0_5-v1-384x256.png';

    private const SHOP_GALLERY_FIRST_PATH_SUFFIX = '/storage/shops/gallery/gen-3x2-x0_5-v1-384x256.png';

    private const SHOP_PHONE = '+7 (999) 345-35-61';

    private const SHOP_TELEGRAM = 'https://t.me/example_shop';

    private const SHOP_WHATSAPP = 'https://wa.me/79990000000';

    private const SHOP_ADDRESS = 'Барнаул, ул. Примерная, 6';

    /**
     * @var list<string>
     */
    private const FEATURE_TITLES = [
        'самая быстрая доставка',
        'акции',
        'круглосуточно',
    ];

    /**
     * @var list<string>
     */
    private const CATEGORY_TITLES = [
        'Отечественные запчасти',
        'Китайски запчасти',
        'Европейские запчасти',
        'Японские запчасти',
        'Корейские запчасти',
    ];

    public function test_city_list_returns_expected_shape_and_values(): void
    {
        $response = $this->getJson('/api/v1/city-list');

        $response
            ->assertOk()
            ->assertJsonStructure([
                '*' => ['id', 'code', 'title', 'sort'],
            ])
            ->assertJsonCount(self::CITY_COUNT)
            ->assertJsonPath('0.code', self::CITY_CODE)
            ->assertJsonPath('0.title', self::CITY_TITLE)
            ->assertJsonPath('0.sort', 0)
            ->assertJsonPath('1.code', 'nizhny')
            ->assertJsonPath('1.title', 'Нижний Новгород')
            ->assertJsonPath('2.code', 'gorno')
            ->assertJsonPath('2.title', 'Горно-Алтайск');

        $first = $response->json('0');
        $this->assertArrayNotHasKey('name', $first);
    }

    public function test_category_list_returns_expected_values(): void
    {
        $response = $this->getJson('/api/v1/category-list');

        $response
            ->assertOk()
            ->assertJsonStructure([
                '*' => ['id', 'title', 'sort'],
            ])
            ->assertJsonCount(count(self::CATEGORY_TITLES));

        $first = $response->json('0');
        $this->assertArrayNotHasKey('code', $first);
        $this->assertSame(1, $first['id']);
        $this->assertSame(self::CATEGORY_TITLES[0], $first['title']);
        $this->assertSame(0, $first['sort']);

        $titles = array_column($response->json(), 'title');
        foreach (self::CATEGORY_TITLES as $expectedTitle) {
            $this->assertContains($expectedTitle, $titles);
        }
    }

    public function test_feature_list_returns_expected_values(): void
    {
        $response = $this->getJson('/api/v1/feature-list');

        $response
            ->assertOk()
            ->assertJsonStructure([
                '*' => ['id', 'title', 'sort'],
            ])
            ->assertJsonCount(count(self::FEATURE_TITLES))
            ->assertJsonPath('0.id', 1)
            ->assertJsonPath('0.title', self::FEATURE_TITLES[0])
            ->assertJsonPath('1.id', 2)
            ->assertJsonPath('2.id', 3);
    }

    public function test_city_catalog_endpoint_returns_expected_city_and_items(): void
    {
        $response = $this->getJson('/api/v1/city/' . self::CITY_CODE);

        $response
            ->assertOk()
            ->assertJsonPath('city.code', self::CITY_CODE)
            ->assertJsonPath('city.title', self::CITY_TITLE)
            ->assertJsonPath('city.sort', 0)
            ->assertJsonCount(self::CITY_ITEMS_COUNT, 'items')
            ->assertJsonPath('items.0.code', self::FIRST_CITY_ITEM_CODE)
            ->assertJsonPath('items.0.title', self::FIRST_CITY_ITEM_TITLE)
            ->assertJsonPath('items.0.cityId', 1);
    }

    public function test_city_catalog_endpoint_returns_404_for_non_existing_city(): void
    {
        $this->getJson('/api/v1/city/not-existing-city-code')
            ->assertNotFound();
    }

    public function test_shop_endpoint_returns_expected_payload_for_existing_shop(): void
    {
        $response = $this->getJson('/api/v1/shop/' . self::SHOP_CODE);

        $response
            ->assertOk()
            ->assertJsonPath('code', self::SHOP_CODE)
            ->assertJsonPath('title', self::SHOP_TITLE)
            ->assertJsonPath('cityId', 1)
            ->assertJsonPath('workHours', self::SHOP_WORK_HOURS)
            ->assertJsonPath('categoryIds.0', 1)
            ->assertJsonPath('featureIds.0', 1)
            ->assertJsonPath('featureIds.1', 2)
            ->assertJsonPath('featureIds.2', 3);

        $thumbUrl = (string) $response->json('thumbUrl');
        $this->assertStringEndsWith(self::SHOP_THUMB_PATH_SUFFIX, $thumbUrl);

        $gallery = $response->json('galleryImages');
        $this->assertIsArray($gallery);
        $this->assertCount(3, $gallery);
        $this->assertStringEndsWith(
            self::SHOP_GALLERY_FIRST_PATH_SUFFIX,
            (string) $gallery[0]
        );
    }

    public function test_shop_endpoint_returns_404_for_non_existing_shop(): void
    {
        $this->getJson('/api/v1/shop/not-existing-shop-code')
            ->assertNotFound();
    }

    public function test_acceptable_contact_types_returns_only_known_requested_contact_types(): void
    {
        $response = $this->postJson(
            '/api/v1/shop/' . self::SHOP_CODE . '/acceptable-contact-types',
            ['phone', 'unknown_contact_type', 'telegram']
        );

        $response
            ->assertOk()
            ->assertJsonPath('phone.0', self::SHOP_PHONE)
            ->assertJsonPath('telegram.0', self::SHOP_TELEGRAM)
            ->assertJsonMissingPath('whatsapp')
            ->assertJsonMissingPath('address')
            ->assertJsonMissingPath('unknown_contact_type');
    }

    public function test_acceptable_contact_types_ignores_invalid_parameter_values(): void
    {
        $response = $this->postJson(
            '/api/v1/shop/' . self::SHOP_CODE . '/acceptable-contact-types',
            [123, true, null, '', '   ', ['phone'], ['type' => 'phone']]
        );

        $response->assertOk();
        $this->assertSame([], $response->json());
    }

    public function test_acceptable_contact_types_returns_known_values_for_requested_types(): void
    {
        $response = $this->postJson(
            '/api/v1/shop/' . self::SHOP_CODE . '/acceptable-contact-types',
            ['phone', 'whatsapp', 'address']
        );

        $response
            ->assertOk()
            ->assertJsonPath('phone.0', self::SHOP_PHONE)
            ->assertJsonPath('whatsapp.0', self::SHOP_WHATSAPP)
            ->assertJsonPath('address.0', self::SHOP_ADDRESS);
    }

    public function test_acceptable_contact_types_returns_404_for_non_existing_shop(): void
    {
        $this->postJson(
            '/api/v1/shop/not-existing-shop-code/acceptable-contact-types',
            ['phone']
        )->assertNotFound();
    }

    public function test_acceptable_contact_types_returns_empty_for_known_but_absent_type(): void
    {
        $response = $this->postJson(
            '/api/v1/shop/' . self::SHOP_CODE . '/acceptable-contact-types',
            ['email']
        );

        $response->assertOk();
        $this->assertSame([], $response->json());
    }
}
