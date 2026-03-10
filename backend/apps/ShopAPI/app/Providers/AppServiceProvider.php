<?php

namespace ShopAPI\Providers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if (config('database.default') !== 'sqlite') {
            return;
        }

        DB::statement('PRAGMA foreign_keys = ON');
        DB::statement('PRAGMA busy_timeout = 5000');
        DB::statement('PRAGMA journal_mode = WAL');
    }
}
