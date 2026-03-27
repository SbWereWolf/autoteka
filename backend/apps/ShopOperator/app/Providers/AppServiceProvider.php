<?php

namespace ShopOperator\Providers;

use Illuminate\Foundation\Http\Events\RequestHandled;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use MoonShine\Crud\Resources\CrudResource;
use ShopOperator\Http\Middleware\InterceptMoonShineHtmlCrudPages;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        app('router')->pushMiddlewareToGroup('moonshine', InterceptMoonShineHtmlCrudPages::class);

        // MoonShine держит текущую запись на экземпляре ресурса между HTTP-вызовами в одном
        // PHP-процессе (типично PHPUnit: несколько post/patch подряд). Полный flushState()
        // ломает страницы/валидацию; достаточно отвязать item, чтобы store снова создавал запись.
        Event::listen(RequestHandled::class, static function (): void {
            if (! function_exists('moonshine')) {
                return;
            }
            foreach (moonshine()->getResources() as $resource) {
                if ($resource instanceof CrudResource) {
                    $resource->setItem(null);
                    $resource->setItemID(null);
                }
            }
        });

        if (config('database.default') !== 'sqlite') {
            return;
        }

/*
        DB::statement('PRAGMA foreign_keys = ON');
        DB::statement('PRAGMA busy_timeout = 5000');
        DB::statement('PRAGMA journal_mode = WAL');
        */
    }
}
