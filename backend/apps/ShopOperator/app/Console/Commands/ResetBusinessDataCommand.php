<?php

declare(strict_types=1);

namespace ShopOperator\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;
use PDO;
use RuntimeException;
use Throwable;

final class ResetBusinessDataCommand extends Command
{
    protected $signature = 'autoteka:business:reset
        {--backup= : Абсолютный путь нового резервного файла .sqlite}
        {--purge-cities : Также очистить справочник городов}';

    protected $description = 'Создать резервную копию SQLite и очистить бизнес-данные, сохранив инфраструктуру';

    public function handle(): int
    {
        $backup = $this->option('backup');
        if (! is_string($backup) || ! str_starts_with($backup, '/') || ! str_ends_with($backup, '.sqlite') || ! is_dir(dirname($backup)) || file_exists($backup)) {
            $this->error('Укажите --backup: абсолютный путь нового файла .sqlite в существующем каталоге.');

            return 2;
        }

        try {
            $connection = DB::connection();
            $database = $connection->getDatabaseName();
            if ($connection->getDriverName() !== 'sqlite' || ! is_file($database) || ! is_readable($database) || ! is_writable($database)) {
                throw new RuntimeException('Нужен существующий файл SQLite, доступный для чтения и записи.');
            }
            $pdo = $connection->getPdo();
            $check = $pdo->query('PRAGMA quick_check');
            if ($check === false || $check->fetchColumn() !== 'ok') {
                throw new RuntimeException('Проверка целостности исходной SQLite БД не пройдена.');
            }
            $check->closeCursor();
            $foreignKeys = $pdo->query('PRAGMA foreign_keys');
            if ($foreignKeys === false || (int) $foreignKeys->fetchColumn() !== 1) {
                throw new RuntimeException('Для очистки должны быть включены внешние ключи SQLite.');
            }
            $foreignKeys->closeCursor();
            $databaseList = $pdo->query("SELECT file FROM pragma_database_list WHERE name = 'main'");
            if ($databaseList === false) {
                throw new RuntimeException('Не удалось определить фактический путь SQLite.');
            }
            $actualPath = $databaseList->fetchColumn();
            if (! is_string($actualPath) || $actualPath !== realpath($database)) {
                throw new RuntimeException('Фактический путь SQLite не соответствует подключению.');
            }
            $databaseList->closeCursor();
            $this->line('База данных: '.$actualPath);
        } catch (Throwable $error) {
            $this->error('База данных недоступна: '.$error->getMessage());

            return 3;
        }

        try {
            $this->createBackup($pdo, $backup);
            $this->line('Резервная копия: '.$backup);
            $violations = $pdo->query('PRAGMA foreign_key_check');
            if ($violations === false || $violations->fetch() !== false) {
                throw new RuntimeException('Нарушена ссылочная целостность SQLite; очистка не выполнялась.');
            }
            $violations->closeCursor();
            $this->clearBusinessData($connection, (bool) $this->option('purge-cities'));
        } catch (Throwable $error) {
            $this->error('Сброс не выполнен: '.$error->getMessage());

            return 1;
        }

        $this->info($this->option('purge-cities')
            ? 'Бизнес-данные и города очищены. Пользователи, роли и инфраструктура сохранены.'
            : 'Бизнес-данные очищены. Города, пользователи, роли и инфраструктура сохранены.');

        return self::SUCCESS;
    }

    private function createBackup(PDO $pdo, string $path): void
    {
        $quotedPath = $pdo->quote($path);
        if ($quotedPath === false) {
            throw new RuntimeException('Не удалось подготовить путь резервной копии.');
        }
        $pdo->exec('VACUUM INTO '.$quotedPath);
        $copy = new PDO('sqlite:'.$path);
        $check = $copy->query('PRAGMA quick_check');
        if ($check === false || $check->fetchColumn() !== 'ok') {
            throw new RuntimeException('Проверка резервной копии не пройдена; очистка не выполнялась.');
        }
    }

    private function clearBusinessData(Connection $connection, bool $purgeCities): void
    {
        $connection->transaction(static function () use ($connection, $purgeCities): void {
            if ($connection->getSchemaBuilder()->hasTable('promotion_image')) {
                $connection->table('promotion_image')->delete();
            }
            foreach ([
                'promotion_gallery_video',
                'promotion_gallery_image',
                'promotion',
                'shop_gallery_video',
                'shop_gallery_image',
                'shop_schedule',
                'shop_contact',
                'shop_feature',
                'shop_category',
                'shop',
                'category',
                'feature',
                'contact_type',
            ] as $table) {
                $connection->table($table)->delete();
            }
            if ($purgeCities) {
                $connection->table('city')->delete();
            }
        });
    }
}
