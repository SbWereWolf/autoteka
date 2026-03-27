<?php

declare(strict_types=1);

namespace Autoteka\DemoPromotion\Console;

use Autoteka\DemoPromotion\Services\PurgeDemoPromotionService;
use Illuminate\Console\Command;

final class DemoPromotionPurgeCommand extends Command
{
    protected $signature = 'demo:promo:purge';

    protected $description = 'Удаляет все demo promotions и связанные gallery files.';

    public function handle(PurgeDemoPromotionService $service): int
    {
        return $service->handle($this);
    }
}
