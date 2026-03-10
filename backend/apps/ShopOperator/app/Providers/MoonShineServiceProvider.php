<?php

declare(strict_types=1);

namespace ShopOperator\Providers;

use ShopOperator\MoonShine\Resources\CategoryResource;
use ShopOperator\MoonShine\Resources\CityResource;
use ShopOperator\MoonShine\Resources\ContactTypeResource;
use ShopOperator\MoonShine\Resources\FeatureResource;
use ShopOperator\MoonShine\Resources\ShopResource;
use Illuminate\Support\ServiceProvider;
use MoonShine\Contracts\Core\DependencyInjection\CoreContract;
use MoonShine\Laravel\DependencyInjection\MoonShine;
use MoonShine\Laravel\DependencyInjection\MoonShineConfigurator;
use ShopOperator\MoonShine\Resources\MoonShineUser\MoonShineUserResource;
use ShopOperator\MoonShine\Resources\MoonShineUserRole\MoonShineUserRoleResource;

class MoonShineServiceProvider extends ServiceProvider
{
    /**
     * @param  CoreContract<MoonShineConfigurator>  $core
     */
    public function boot(CoreContract $core): void
    {
        $core
            ->resources([
                MoonShineUserResource::class,
                MoonShineUserRoleResource::class,
                CityResource::class,
                CategoryResource::class,
                FeatureResource::class,
                ContactTypeResource::class,
                ShopResource::class,
            ])
            ->pages([
                ...$core->getConfig()->getPages(),
            ])
        ;
    }
}
