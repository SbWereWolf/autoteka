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

    private const CITY_CODE = 'barnaul';

    private const CITY_TITLE = 'Барнаул';

    private const SHOP_CODE = 'barnaul-04';

    private const SHOP_TITLE = 'Шины&Диски';

    private const SHOP_WORK_HOURS = 'Ежедневно 10:00–20:00';

    /**
     * @var list<string>
     */
    private const UNPUBLISHED_CATEGORY_TITLES = [];

    /**
     * @var list<string>
     */
    private const PUBLISHED_CATEGORY_TITLES = [
        'Отечественные запчасти',
        'Китайски запчасти',
        'Европейские запчасти',
        'Японские запчасти',
        'Корейские запчасти',
    ];

    public function test_city_list_returns_expected_shape(): void
    {
        $response = $this->getJson('/api/v1/city-list');

        $response
            ->assertOk()
            ->assertJsonStructure([
                '*' => ['id', 'code', 'title', 'sort'],
            ]);

        $first = $response->json('0');
        if ($first !== null) {
            $this->assertArrayNotHasKey('name', $first);
            $this->assertSame(self::CITY_CODE, $first['code']);
            $this->assertSame(self::CITY_TITLE, $first['title']);
        }
    }

    public function test_category_list_hides_code_and_filters_unpublished_rows(): void
    {
        $response = $this->getJson('/api/v1/category-list');

        $response
            ->assertOk()
            ->assertJsonStructure([
                '*' => ['id', 'title', 'sort'],
            ]);

        $first = $response->json('0');
        if ($first !== null) {
            $this->assertArrayNotHasKey('code', $first);
        }

        foreach (self::UNPUBLISHED_CATEGORY_TITLES as $title) {
            $response->assertJsonMissing(['title' => $title]);
        }

        $titles = array_column($response->json(), 'title');
        foreach (self::PUBLISHED_CATEGORY_TITLES as $expectedTitle) {
            $this->assertContains($expectedTitle, $titles);
        }
    }

    public function test_city_and_shop_endpoints_resolve_by_code(): void
    {
        $this->getJson('/api/v1/city/' . self::CITY_CODE)
            ->assertOk()
            ->assertJsonPath('city.code', self::CITY_CODE)
            ->assertJsonPath('city.title', self::CITY_TITLE);

        $this->getJson('/api/v1/shop/' . self::SHOP_CODE)
            ->assertOk()
            ->assertJsonPath('code', self::SHOP_CODE)
            ->assertJsonPath('title', self::SHOP_TITLE)
            ->assertJsonPath('workHours', self::SHOP_WORK_HOURS);
    }

    public function test_acceptable_contact_types_returns_grouped_filtered_contacts(): void
    {
        $targetCodes = ['phone', 'whatsapp'];

        $response = $this->postJson(
            '/api/v1/shop/' . self::SHOP_CODE . '/acceptable-contact-types',
            $targetCodes
        );

        $response->assertOk();

        $data = $response->json();
        $this->assertIsArray($data);
        $this->assertArrayHasKey('phone', $data);
        $this->assertArrayHasKey('whatsapp', $data);
        $this->assertArrayNotHasKey('email', $data);
    }
}
