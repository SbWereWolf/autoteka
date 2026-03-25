<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Resources\MoonShineUserRole\Pages;

use MoonShine\Contracts\Core\TypeCasts\DataWrapperContract;
use MoonShine\Contracts\UI\ComponentContract;
use MoonShine\Contracts\UI\FieldContract;
use MoonShine\Laravel\Models\MoonshineUserRole;
use MoonShine\Laravel\Pages\Crud\FormPage;
use Autoteka\SchemaDefinition\SchemaTables\SchemaMoonshineUserRoles;
use ShopOperator\MoonShine\Resources\MoonShineUserRole\MoonShineUserRoleResource;
use MoonShine\UI\Components\Layout\Box;
use MoonShine\UI\Fields\ID;
use MoonShine\UI\Fields\Text;

/**
 * @extends FormPage<MoonShineUserRoleResource, MoonshineUserRole>
 */
final class MoonShineUserRoleFormPage extends FormPage
{
    /**
     * @return list<ComponentContract|FieldContract>
     */
    protected function fields(): iterable
    {
        $sch = new SchemaMoonshineUserRoles();

        return [
            Box::make([
                ID::make(),
                Text::make(__('moonshine::ui.resource.role_name'), $sch->name())
                    ->required()
                    ->placeholder('Например: Оператор магазина'),
            ]),
        ];
    }

    protected function rules(DataWrapperContract $item): array
    {
        $sch = new SchemaMoonshineUserRoles();

        return [
            $sch->name() => ['required', 'min:5'],
        ];
    }
}
