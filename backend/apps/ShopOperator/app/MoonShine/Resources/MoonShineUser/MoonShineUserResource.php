<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Resources\MoonShineUser;

use Autoteka\SchemaDefinition\Enums\Columns\MoonshineUsersColumns;
use Autoteka\SchemaDefinition\SchemaTables\SchemaMoonshineUsers;
use MoonShine\Laravel\Models\MoonshineUser;
use MoonShine\Laravel\Resources\ModelResource;
use ShopOperator\MoonShine\Resources\MoonShineUser\Pages\MoonShineUserFormPage;
use ShopOperator\MoonShine\Resources\MoonShineUser\Pages\MoonShineUserIndexPage;
use MoonShine\MenuManager\Attributes\Group;
use MoonShine\MenuManager\Attributes\Order;
use MoonShine\Support\Attributes\Icon;
use MoonShine\Support\Enums\Action;
use MoonShine\Support\ListOf;

/**
 * @extends ModelResource<MoonshineUser, MoonShineUserIndexPage, MoonShineUserFormPage, null>
 */
#[Icon('users')]
#[Group('moonshine::ui.resource.system', 'users', translatable: true)]
#[Order(0)]
class MoonShineUserResource extends ModelResource
{
    protected string $model = MoonshineUser::class;

    protected string $column = MoonshineUsersColumns::NAME->value;

    protected array $with = ['moonshineUserRole'];

    protected bool $simplePaginate = true;

    public function getTitle(): string
    {
        return __('moonshine::ui.resource.admins_title');
    }

    protected function activeActions(): ListOf
    {
        return parent::activeActions()->except(Action::VIEW);
    }

    protected function pages(): array
    {
        return [
            MoonShineUserIndexPage::class,
            MoonShineUserFormPage::class,
        ];
    }

    protected function search(): array
    {
        $s = new SchemaMoonshineUsers();

        return [
            $s->id(),
            $s->name(),
        ];
    }
}
