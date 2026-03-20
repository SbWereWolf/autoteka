<?php

declare(strict_types=1);

namespace Autoteka\IsThereAnAdmin;

use Autoteka\IsThereAnAdmin\Console\IsThereAnAdminCommand;
use Illuminate\Support\ServiceProvider;

final class IsThereAnAdminServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                IsThereAnAdminCommand::class,
            ]);
        }
    }
}
