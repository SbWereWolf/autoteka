<?php

declare(strict_types=1);

namespace Autoteka\LaravelRuntime;

use Autoteka\LaravelRuntime\Console\SessionPruneCommand;
use Illuminate\Support\ServiceProvider;

final class LaravelRuntimeServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                SessionPruneCommand::class,
            ]);
        }
    }
}
