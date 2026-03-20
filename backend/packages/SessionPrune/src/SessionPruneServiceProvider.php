<?php

declare(strict_types=1);

namespace Autoteka\SessionPrune;

use Autoteka\SessionPrune\Console\SessionPruneCommand;
use Illuminate\Support\ServiceProvider;

final class SessionPruneServiceProvider extends ServiceProvider
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
