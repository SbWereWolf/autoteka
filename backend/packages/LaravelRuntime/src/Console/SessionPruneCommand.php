<?php

declare(strict_types=1);

namespace Autoteka\LaravelRuntime\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Session;

final class SessionPruneCommand extends Command
{
    protected $signature = 'autoteka:session:prune';

    protected $description = 'Remove expired sessions (file or database driver)';

    public function handle(): int
    {
        $lifetime = (int) config('session.lifetime');
        $maxLifetime = $lifetime * 60;
        $handler = Session::getHandler();
        $handler->gc($maxLifetime);
        $this->info('Session prune completed.');

        return self::SUCCESS;
    }
}
