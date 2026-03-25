<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Resources\MoonShineUserRole;

use Autoteka\SchemaDefinition\Enums\Columns\MoonshineUserRolesColumns;
use Autoteka\SchemaDefinition\SchemaTables\SchemaMoonshineUserRoles;
use MoonShine\Laravel\Models\MoonshineUserRole;
use MoonShine\Laravel\Resources\ModelResource;
use ShopOperator\MoonShine\Resources\MoonShineUserRole\Pages\MoonShineUserRoleFormPage;
use ShopOperator\MoonShine\Resources\MoonShineUserRole\Pages\MoonShineUserRoleIndexPage;
use MoonShine\MenuManager\Attributes\Group;
use MoonShine\MenuManager\Attributes\Order;
use MoonShine\Support\Attributes\Icon;
use MoonShine\Support\Enums\Action;
use MoonShine\Support\ListOf;

/**
 * @extends ModelResource<MoonshineUserRole, MoonShineUserRoleIndexPage, MoonShineUserRoleFormPage, null>
 */
#[Icon('bookmark')]
#[Group('moonshine::ui.resource.system', 'users', translatable: true)]
#[Order(1)]
class MoonShineUserRoleResource extends ModelResource
{
    protected string $model = MoonshineUserRole::class;

    protected string $column = MoonshineUserRolesColumns::NAME->value;

    protected bool $createInModal = true;

    protected bool $detailInModal = true;

    protected bool $editInModal = true;

    protected bool $cursorPaginate = true;

    public function getTitle(): string
    {
        return __('moonshine::ui.resource.role');
    }

    protected function activeActions(): ListOf
    {
        return parent::activeActions()->except(Action::VIEW);
    }

    protected function pages(): array
    {
        return [
            MoonShineUserRoleIndexPage::class,
            MoonShineUserRoleFormPage::class,
        ];
    }

    protected function search(): array
    {
        $s = new SchemaMoonshineUserRoles();

        return [
            $s->id(),
            $s->name(),
        ];
    }
}
