<?php

declare(strict_types=1);

namespace App\Providers;

use App\MoonShine\Resources\CategoryResource;
use App\MoonShine\Resources\CityResource;
use App\MoonShine\Resources\ContactTypeResource;
use App\MoonShine\Resources\FeatureResource;
use App\MoonShine\Resources\ShopResource;
use Illuminate\Support\ServiceProvider;
use MoonShine\Contracts\Core\DependencyInjection\CoreContract;
use MoonShine\Laravel\DependencyInjection\MoonShine;
use MoonShine\Laravel\DependencyInjection\MoonShineConfigurator;
use App\MoonShine\Resources\MoonShineUser\MoonShineUserResource;
use App\MoonShine\Resources\MoonShineUserRole\MoonShineUserRoleResource;

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
