<?php

declare(strict_types=1);

namespace Autoteka\IsThereAnAdmin\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use MoonShine\Laravel\Models\MoonshineUser;
use Throwable;

final class IsThereAnAdminCommand extends Command
{
    public const EXIT_MISSING = 0;
    public const EXIT_ERROR = 1;
    public const EXIT_INVALID_ARGS = 2;
    public const EXIT_DB_UNAVAILABLE = 3;
    public const EXIT_PRESENT = 4;

    protected $signature = 'autoteka:is-there-an-admin {email}';

    protected $description = 'Проверяет, существует ли admin-учётка MoonShine.';

    public function handle(): int
    {
        $email = (string) $this->argument('email');
        $validator = Validator::make(
            ['email' => $email],
            ['email' => ['required', 'email']],
        );

        if ($validator->fails()) {
            $this->error($validator->errors()->first('email'));

            return self::EXIT_INVALID_ARGS;
        }

        try {
            if (! Schema::hasTable('moonshine_users')) {
                $this->error('База данных или таблица moonshine_users недоступна.');

                return self::EXIT_DB_UNAVAILABLE;
            }

            $exists = MoonshineUser::query()
                ->where('email', $email)
                ->exists();
        } catch (Throwable $e) {
            $message = mb_strtolower($e->getMessage());
            if (str_contains($message, 'no such table')
                || str_contains($message, 'doesn\'t exist')
                || str_contains($message, 'unable to open database file')
                || str_contains($message, 'could not find driver')
                || str_contains($message, 'connection')
            ) {
                $this->error('База данных или таблица moonshine_users недоступна.');

                return self::EXIT_DB_UNAVAILABLE;
            }

            $this->error($e->getMessage());

            return self::EXIT_ERROR;
        }

        if ($exists) {
            $this->line('present');

            return self::EXIT_PRESENT;
        }

        $this->line('missing');

        return self::EXIT_MISSING;
    }
}
