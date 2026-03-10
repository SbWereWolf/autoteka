<?php

declare(strict_types=1);

namespace Tests\Feature;

use ShopOperator\Models\ContactType;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use MoonShine\Laravel\Models\MoonshineUser;
use MoonShine\Laravel\Models\MoonshineUserRole;
use Tests\TestCase;

final class AdminHttpContactTypeCrudCycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_contact_type_full_cycle_create_publish_edit_hide_and_invalid(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $admin = $this->createAdminUser();
        $this->actingAs($admin, 'moonshine');

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'contact-type-resource']), [
            'code' => 'contact-cycle',
            'title' => 'Contact Cycle',
            'sort' => 10,
            'is_published' => '0',
        ])->assertStatus(302);

        $contactType = ContactType::query()->where('code', 'contact-cycle')->firstOrFail();
        $this->assertSame(0, (int) $contactType->is_published);

        $this->patch(route('moonshine.crud.update', [
            'resourceUri' => 'contact-type-resource',
            'resourceItem' => $contactType->id,
        ]), [
            'code' => 'contact-cycle',
            'title' => 'Contact Cycle',
            'sort' => 10,
            'is_published' => '1',
        ])->assertStatus(302);
        $this->assertDatabaseHas('contact_type', [
            'id' => $contactType->id,
            'is_published' => 1,
        ]);

        $this->patch(route('moonshine.crud.update', [
            'resourceUri' => 'contact-type-resource',
            'resourceItem' => $contactType->id,
        ]), [
            'code' => 'contact-cycle-updated',
            'title' => 'Contact Cycle Updated',
            'sort' => 99,
            'is_published' => '1',
        ])->assertStatus(302);
        $this->assertDatabaseHas('contact_type', [
            'id' => $contactType->id,
            'code' => 'contact-cycle',
            'title' => 'Contact Cycle Updated',
            'sort' => 99,
            'is_published' => 1,
        ]);
        $this->assertDatabaseMissing('contact_type', [
            'id' => $contactType->id,
            'code' => 'contact-cycle-updated',
        ]);

        $this->patch(route('moonshine.crud.update', [
            'resourceUri' => 'contact-type-resource',
            'resourceItem' => $contactType->id,
        ]), [
            'code' => 'contact-cycle-updated',
            'title' => 'Contact Cycle Updated',
            'sort' => 99,
            'is_published' => '0',
        ])->assertStatus(302);
        $this->assertDatabaseHas('contact_type', [
            'id' => $contactType->id,
            'is_published' => 0,
        ]);

        $this->post(route('moonshine.crud.store', ['resourceUri' => 'contact-type-resource']), [
            'code' => 'contact-cycle-invalid',
            'title' => '',
            'sort' => 5,
            'is_published' => '1',
        ])->assertStatus(302);
        $this->assertDatabaseMissing('contact_type', ['code' => 'contact-cycle-invalid']);
    }

    private function createAdminUser(): MoonshineUser
    {
        $role = MoonshineUserRole::query()->firstOrCreate(
            ['id' => MoonshineUserRole::DEFAULT_ROLE_ID],
            ['name' => 'Admin'],
        );

        return MoonshineUser::query()->create([
            'moonshine_user_role_id' => $role->getKey(),
            'email' => 'admin-contact-cycle@example.com',
            'name' => 'Admin Contact Cycle',
            'password' => bcrypt('admin12345'),
        ]);
    }
}
