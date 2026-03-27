<?php

declare(strict_types=1);

namespace Autoteka\DemoPromotion;

use Autoteka\DemoPromotion\Console\DemoPromotionCreateCommand;
use Autoteka\DemoPromotion\Console\DemoPromotionPurgeCommand;
use Autoteka\DemoPromotion\Services\CreateDemoPromotionService;
use Autoteka\DemoPromotion\Services\PurgeDemoPromotionService;
use Autoteka\DemoPromotion\Support\PromotionImageStager;
use Illuminate\Support\ServiceProvider;

final class DemoPromotionServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PromotionImageStager::class);
        $this->app->singleton(CreateDemoPromotionService::class);
        $this->app->singleton(PurgeDemoPromotionService::class);
    }

    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                DemoPromotionCreateCommand::class,
                DemoPromotionPurgeCommand::class,
            ]);
        }
    }
}
