<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Resources\MoonShineUserRole\Pages;

use MoonShine\Contracts\UI\FieldContract;
use MoonShine\Laravel\Pages\Crud\IndexPage;
use Autoteka\SchemaDefinition\SchemaTables\SchemaMoonshineUserRoles;
use ShopOperator\MoonShine\Resources\MoonShineUserRole\MoonShineUserRoleResource;
use MoonShine\UI\Fields\ID;
use MoonShine\UI\Fields\Text;

/**
 * @extends IndexPage<MoonShineUserRoleResource>
 */
final class MoonShineUserRoleIndexPage extends IndexPage
{
    /**
     * @return list<FieldContract>
     */
    protected function fields(): iterable
    {
        $sch = new SchemaMoonshineUserRoles();

        return [
            ID::make()->sortable(),
            Text::make(__('moonshine::ui.resource.role_name'), $sch->name()),
        ];
    }
}
