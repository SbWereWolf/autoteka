<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Resources\MoonShineUser\Pages;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password as PasswordRule;
use MoonShine\Contracts\Core\TypeCasts\DataWrapperContract;
use MoonShine\Contracts\UI\ComponentContract;
use MoonShine\Contracts\UI\FieldContract;
use MoonShine\Laravel\Fields\Relationships\BelongsTo;
use MoonShine\Laravel\Models\MoonshineUser;
use MoonShine\Laravel\Models\MoonshineUserRole;
use MoonShine\Laravel\Pages\Crud\FormPage;
use ShopOperator\MoonShine\Resources\MoonShineUser\MoonShineUserResource;
use ShopOperator\MoonShine\Resources\MoonShineUserRole\MoonShineUserRoleResource;
use MoonShine\UI\Components\Collapse;
use MoonShine\UI\Components\Layout\Box;
use MoonShine\UI\Components\Layout\Flex;
use MoonShine\UI\Components\Tabs;
use MoonShine\UI\Components\Tabs\Tab;
use MoonShine\UI\Fields\Email;
use MoonShine\UI\Fields\ID;
use MoonShine\UI\Fields\Image;
use MoonShine\UI\Fields\Preview;
use MoonShine\UI\Fields\Password;
use MoonShine\UI\Fields\PasswordRepeat;
use MoonShine\UI\Fields\Text;

/**
 * @extends FormPage<MoonShineUserResource, MoonShineUser>
 */
final class MoonShineUserFormPage extends FormPage
{
    /**
     * @return list<ComponentContract|FieldContract>
     */
    protected function fields(): iterable
    {
        return [
            Box::make([
                Tabs::make([
                    Tab::make(__('moonshine::ui.resource.main_information'), [
                        ID::make(),

                        BelongsTo::make(
                            __('moonshine::ui.resource.role'),
                            'moonshineUserRole',
                            formatted: static fn (MoonshineUserRole $model) => $model->name,
                            resource: MoonShineUserRoleResource::class,
                        )
                            ->creatable()
                            ->valuesQuery(static fn (Builder $q) => $q->select(['id', 'name'])),

                        Flex::make([
                            Text::make(__('moonshine::ui.resource.name'), 'name')
                                ->required()
                                ->placeholder('Например: Иван Оператор'),

                            Email::make(__('moonshine::ui.resource.email'), 'email')
                                ->required()
                                ->placeholder('operator@example.com'),
                        ]),

                        Image::make(__('moonshine::ui.resource.avatar'), 'avatar')
                            ->disk(moonshineConfig()->getDisk())
                            ->dir(moonshineConfig()->getUserAvatarsDir())
                            ->allowedExtensions(['jpg', 'png', 'jpeg', 'gif']),

                        Preview::make(
                            __('moonshine::ui.resource.created_at'),
                            formatted: fn ($item) => $item->created_at?->format('d.m.Y H:i') ?? '',
                        ),
                        Preview::make(
                            'Обновлён',
                            formatted: fn ($item) => $item->updated_at?->format('d.m.Y H:i') ?? '',
                        ),
                    ])->icon('user-circle'),

                    Tab::make(__('moonshine::ui.resource.password'), [
                        Collapse::make(__('moonshine::ui.resource.change_password'), [
                            Password::make(__('moonshine::ui.resource.password'), 'password')
                                ->customAttributes(['autocomplete' => 'new-password'])
                                ->placeholder('Не менее 8 символов')
                                ->eye(),

                            PasswordRepeat::make(__('moonshine::ui.resource.repeat_password'), 'password_confirmation')
                                ->customAttributes(['autocomplete' => 'confirm-password'])
                                ->placeholder('Повторите пароль')
                                ->eye(),
                        ])->icon('lock-closed'),
                    ])->icon('lock-closed'),
                ]),
            ]),
        ];
    }

    protected function rules(DataWrapperContract $item): array
    {
        return [
            'name' => 'required',
            'moonshine_user_role_id' => 'required',
            'email' => [
                'sometimes',
                'bail',
                'required',
                'email',
                Rule::unique($item->getOriginal()::class)->ignoreModel($item->getOriginal()),
            ],
            'avatar' => ['sometimes', 'nullable', 'image', 'mimes:jpeg,jpg,png,gif'],
            'password' => [
                ...$item->getKey() !== null ? ['sometimes', 'nullable'] : ['required'],
                PasswordRule::defaults(),
                'confirmed',
            ],
        ];
    }
}
