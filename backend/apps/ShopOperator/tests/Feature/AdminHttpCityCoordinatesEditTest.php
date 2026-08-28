<?php

declare(strict_types=1);

namespace Tests\Feature;

use DOMDocument;
use DOMElement;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use MoonShine\Laravel\Models\MoonshineUser;
use MoonShine\Laravel\Models\MoonshineUserRole;
use ShopOperator\Models\City;
use Tests\TestCase;

final class AdminHttpCityCoordinatesEditTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_edit_city_coordinates_through_rendered_form(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $this->actingAs($this->createAdminUser(), 'moonshine');

        $city = City::query()->create([
            'code' => 'city-coordinates',
            'title' => 'City Coordinates',
            'sort' => 10,
            'is_published' => true,
        ]);
        DB::table('city')->where('id', $city->id)->update([
            'latitude' => 53.300001,
            'longitude' => 83.700001,
        ]);

        $editRoute = route('moonshine.crud.edit', [
            'resourceUri' => 'city-resource',
            'resourceItem' => $city->id,
        ]);

        $before = $this->get($editRoute)->assertOk();
        $latitude = $this->inputByName($before->getContent(), 'latitude');
        $longitude = $this->inputByName($before->getContent(), 'longitude');

        self::assertSame('number', $latitude->getAttribute('type'));
        self::assertSame('-90', $latitude->getAttribute('min'));
        self::assertSame('90', $latitude->getAttribute('max'));
        self::assertSame('0.001', $latitude->getAttribute('step'));
        self::assertSame('55.756', $latitude->getAttribute('placeholder'));
        self::assertTrue($latitude->hasAttribute('required'));
        self::assertEqualsWithDelta(53.300001, (float) $latitude->getAttribute('value'), 0.0000001);

        self::assertSame('number', $longitude->getAttribute('type'));
        self::assertSame('-180', $longitude->getAttribute('min'));
        self::assertSame('180', $longitude->getAttribute('max'));
        self::assertSame('0.001', $longitude->getAttribute('step'));
        self::assertSame('37.617', $longitude->getAttribute('placeholder'));
        self::assertTrue($longitude->hasAttribute('required'));
        self::assertEqualsWithDelta(83.700001, (float) $longitude->getAttribute('value'), 0.0000001);

        $this->patch(route('moonshine.crud.update', [
            'resourceUri' => 'city-resource',
            'resourceItem' => $city->id,
        ]), [
            'title' => 'City Coordinates',
            'sort' => 10,
            'latitude' => '53.347400',
            'longitude' => '83.778400',
            'is_published' => '1',
        ])->assertStatus(302)->assertSessionHasNoErrors();

        $this->assertDatabaseHas('city', [
            'id' => $city->id,
            'latitude' => 53.3474,
            'longitude' => 83.7784,
        ]);

        moonshine()->getResources()->findByUri('city-resource')?->flushState();

        $after = $this->get($editRoute)->assertOk();
        self::assertEqualsWithDelta(
            53.3474,
            (float) $this->inputByName($after->getContent(), 'latitude')->getAttribute('value'),
            0.0000001,
        );
        self::assertEqualsWithDelta(
            83.7784,
            (float) $this->inputByName($after->getContent(), 'longitude')->getAttribute('value'),
            0.0000001,
        );

        $this->get(route('moonshine.index', ['resourceUri' => 'city-resource']))
            ->assertOk()
            ->assertDontSee('Широта')
            ->assertDontSee('Долгота');
    }

    public function test_city_coordinate_validation_rejects_missing_and_out_of_range_values(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $this->actingAs($this->createAdminUser(), 'moonshine');

        $city = City::query()->create([
            'code' => 'city-coordinate-validation',
            'title' => 'City Coordinate Validation',
            'sort' => 20,
            'is_published' => true,
        ]);
        DB::table('city')->where('id', $city->id)->update([
            'latitude' => 55.0,
            'longitude' => 37.0,
        ]);

        $route = route('moonshine.crud.update', [
            'resourceUri' => 'city-resource',
            'resourceItem' => $city->id,
        ]);

        $this->from(route('moonshine.crud.edit', [
            'resourceUri' => 'city-resource',
            'resourceItem' => $city->id,
        ]))->patch($route, [
            'title' => 'City Coordinate Validation',
            'sort' => 20,
            'longitude' => '37.0',
            'is_published' => '1',
        ])->assertSessionHasErrors('latitude');

        $this->patch($route, [
            'title' => 'City Coordinate Validation',
            'sort' => 20,
            'latitude' => '91',
            'longitude' => '37.0',
            'is_published' => '1',
        ])->assertSessionHasErrors('latitude');

        $this->assertDatabaseHas('city', [
            'id' => $city->id,
            'latitude' => 55.0,
            'longitude' => 37.0,
        ]);
    }

    private function inputByName(string $html, string $name): DOMElement
    {
        $dom = new DOMDocument();
        @$dom->loadHTML($html);

        foreach ($dom->getElementsByTagName('input') as $input) {
            if ($input instanceof DOMElement && $input->getAttribute('name') === $name) {
                return $input;
            }
        }

        self::fail("Input '{$name}' not found.");
    }

    private function createAdminUser(): MoonshineUser
    {
        $role = MoonshineUserRole::query()->firstOrCreate(
            ['id' => MoonshineUserRole::DEFAULT_ROLE_ID],
            ['name' => 'Admin'],
        );

        return MoonshineUser::query()->create([
            'moonshine_user_role_id' => $role->getKey(),
            'email' => 'admin-city-coordinates@example.com',
            'name' => 'Admin City Coordinates',
            'password' => bcrypt('admin12345'),
        ]);
    }
}
