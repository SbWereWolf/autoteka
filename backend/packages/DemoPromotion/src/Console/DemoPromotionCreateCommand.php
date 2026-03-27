<?php

declare(strict_types=1);

namespace Autoteka\DemoPromotion\Console;

use Autoteka\DemoPromotion\Services\CreateDemoPromotionService;
use Illuminate\Console\Command;

final class DemoPromotionCreateCommand extends Command
{
    protected $signature = 'demo:promo:create';

    protected $description = 'Генерирует demo promotions для показа заказчику.';

    public function handle(CreateDemoPromotionService $service): int
    {
        return $service->handle($this);
    }
}
