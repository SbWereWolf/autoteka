<?php

declare(strict_types=1);

namespace Autoteka\SchemaDefinition;

use Illuminate\Support\ServiceProvider;

final class SchemaDefinitionServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
    }
}
