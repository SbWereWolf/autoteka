<?php

declare(strict_types=1);

namespace Tests\Feature\Console;

use PDO;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Process\Process;

final class BusinessResetCommandTest extends TestCase
{
    private const BUSINESS = [
        'category', 'feature', 'contact_type', 'shop', 'shop_category',
        'shop_feature', 'shop_contact', 'shop_gallery_image', 'shop_gallery_video',
        'shop_schedule', 'promotion', 'promotion_image', 'promotion_gallery_image',
        'promotion_gallery_video',
    ];

    private string $directory;

    private string $database;

    private ?PDO $pdo;

    protected function setUp(): void
    {
        $this->directory = sys_get_temp_dir().'/autoteka-reset-'.bin2hex(random_bytes(8));
        mkdir($this->directory);
        $this->database = $this->directory.'/source.sqlite';
        $this->pdo = new PDO('sqlite:'.$this->database);
        $this->pdo->exec('PRAGMA user_version=0');
        $this->pdo->exec("VACUUM INTO '".$this->directory."/before-migrate.database.sqlite'");
        $this->runArtisan(['migrate', '--force'])->mustRun();
        // Characterize the legacy table present in the installed database.
        $this->pdo->exec('CREATE TABLE promotion_image (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, promotion_id INTEGER NOT NULL REFERENCES promotion(id) ON DELETE RESTRICT, file_path VARCHAR NOT NULL, original_name VARCHAR, sort INTEGER NOT NULL DEFAULT 0, is_published INTEGER NOT NULL DEFAULT 1, created_at DATETIME, updated_at DATETIME)');
        $this->pdo->exec('CREATE UNIQUE INDEX promotion_image_file_path_unique ON promotion_image(file_path)');
        $this->pdo->exec('PRAGMA foreign_keys=ON');
        $this->seed();
    }

    protected function tearDown(): void
    {
        $this->pdo = null;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($this->directory, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST,
        );
        foreach ($iterator as $entry) {
            $entry->isDir() ? rmdir($entry->getPathname()) : unlink($entry->getPathname());
        }
        rmdir($this->directory);
    }

    #[DataProvider('cityModes')]
    public function test_clears_business_only_and_restores_a_complete_wal_backup(bool $purgeCities, bool $legacy): void
    {
        if (! $legacy) {
            $this->pdo->exec('DROP TABLE promotion_image');
        }
        $this->pdo->exec('PRAGMA journal_mode=WAL');
        $this->pdo->exec('PRAGMA wal_checkpoint(TRUNCATE)');
        $this->pdo->exec('PRAGMA wal_autocheckpoint=0');
        $this->insert('city', ['id' => 99, 'code' => 'wal-sentinel', 'title' => 'WAL']);
        $immutable = new PDO('sqlite:file:'.$this->database.'?immutable=1');
        self::assertSame(0, (int) $immutable->query('SELECT count(*) FROM city WHERE id=99')->fetchColumn());
        self::assertSame(1, (int) $this->pdo->query('SELECT count(*) FROM city WHERE id=99')->fetchColumn());
        $before = $this->snapshot($this->pdo);
        $backup = $this->directory.'/backup.database.sqlite';
        $process = $this->reset($backup, $purgeCities);
        self::assertSame(0, $process->getExitCode(), $process->getOutput().$process->getErrorOutput());
        self::assertStringContainsString($backup, $process->getOutput());
        self::assertStringContainsString($this->database, $process->getOutput());
        $after = $this->snapshot($this->pdo);
        self::assertSame($before['schema'], $after['schema']);
        foreach ($before['data'] as $table => $rows) {
            if (in_array($table, self::BUSINESS, true) || ($purgeCities && $table === 'city')) {
                self::assertSame([], $after['data'][$table], $table);
            } else {
                self::assertSame($rows, $after['data'][$table], $table);
            }
        }
        self::assertSame([], $this->pdo->query('PRAGMA foreign_key_check')->fetchAll());
        $copy = new PDO('sqlite:file:'.$backup.'?immutable=1');
        self::assertSame('ok', $copy->query('PRAGMA quick_check')->fetchColumn());
        self::assertSame($before, $this->snapshot($copy));
        $copy->exec("VACUUM INTO '".$this->directory."/restored.database.sqlite'");
        self::assertSame($before, $this->snapshot(new PDO('sqlite:'.$this->directory.'/restored.database.sqlite')));
        $second = $this->reset($this->directory.'/second.database.sqlite', $purgeCities);
        self::assertSame(0, $second->getExitCode(), $second->getOutput());
        self::assertSame($after, $this->snapshot($this->pdo));
        $secondCopy = new PDO('sqlite:file:'.$this->directory.'/second.database.sqlite?immutable=1');
        self::assertSame('ok', $secondCopy->query('PRAGMA quick_check')->fetchColumn());
        self::assertSame($after, $this->snapshot($secondCopy));
    }

    public static function cityModes(): array
    {
        return [
            'legacy keep cities' => [false, true],
            'legacy purge cities' => [true, true],
            'canonical keep cities' => [false, false],
            'canonical purge cities' => [true, false],
        ];
    }

    #[DataProvider('invalidBackupArguments')]
    public function test_rejects_invalid_backup_arguments_without_changes(string $argument): void
    {
        $before = $this->snapshot($this->pdo);
        $path = str_replace('{dir}', $this->directory, $argument);
        $process = $this->runArtisan(['autoteka:business:reset', '--backup='.$path])->run();
        self::assertSame(2, $process);
        self::assertSame($before, $this->snapshot($this->pdo));
    }

    public static function invalidBackupArguments(): array
    {
        return [
            'missing' => [''],
            'relative' => ['backup.sqlite'],
            'extension' => ['{dir}/backup.txt'],
            'missing parent' => ['{dir}/missing/backup.sqlite'],
        ];
    }

    public function test_does_not_overwrite_backup_or_delete_when_backup_creation_fails(): void
    {
        $backup = $this->directory.'/existing.sqlite';
        file_put_contents($backup, 'existing backup');
        $before = $this->snapshot($this->pdo);
        self::assertSame(2, $this->reset($backup)->getExitCode());
        self::assertSame('existing backup', file_get_contents($backup));
        self::assertSame(1, $this->reset('/proc/autoteka-reset-'.bin2hex(random_bytes(4)).'.sqlite')->getExitCode());
        self::assertSame($before, $this->snapshot($this->pdo));
    }

    #[DataProvider('unavailableDatabases')]
    public function test_rejects_unavailable_database_without_creating_a_backup(string $mode): void
    {
        $before = $this->snapshot($this->pdo);
        $this->pdo = null;
        if ($mode === 'missing') {
            unlink($this->database);
        } elseif ($mode === 'corrupt') {
            file_put_contents($this->database, 'not a sqlite database');
        } else {
            chmod($this->database, 0444);
        }
        $bytes = is_file($this->database) ? file_get_contents($this->database) : null;
        try {
            $backup = $this->directory.'/backup.sqlite';
            $process = $this->reset($backup);
            self::assertSame(3, $process->getExitCode(), $process->getOutput().$process->getErrorOutput());
            self::assertNotSame('', trim($process->getOutput().$process->getErrorOutput()));
            self::assertFileDoesNotExist($backup);
            self::assertSame($bytes, is_file($this->database) ? file_get_contents($this->database) : null);
            if ($mode === 'readonly') {
                self::assertSame($before, $this->snapshot(new PDO('sqlite:'.$this->database)));
            }
        } finally {
            if (is_file($this->database)) {
                chmod($this->database, 0644);
            }
        }
    }

    public static function unavailableDatabases(): array
    {
        return ['missing' => ['missing'], 'corrupt' => ['corrupt'], 'readonly' => ['readonly']];
    }

    public function test_rolls_back_changes_that_precede_a_delete_error(): void
    {
        $this->pdo->exec("CREATE TRIGGER refuse_reset BEFORE DELETE ON category WHEN (SELECT count(*) FROM shop)=0 AND (SELECT count(*) FROM shop_category)=0 BEGIN SELECT RAISE(ABORT, 'reset-test-after-delete'); END");
        $before = $this->snapshot($this->pdo);
        $backup = $this->directory.'/backup.sqlite';
        $process = $this->reset($backup);
        self::assertSame(1, $process->getExitCode());
        self::assertStringContainsString('reset-test-after-delete', $process->getOutput().$process->getErrorOutput());
        self::assertSame($before, $this->snapshot($this->pdo));
        self::assertSame($before, $this->snapshot(new PDO('sqlite:'.$backup)));
    }

    public function test_incomplete_schema_does_not_partially_clear_data(): void
    {
        $this->pdo->exec('PRAGMA foreign_keys=OFF');
        $this->pdo->exec('DROP TABLE category');
        $before = $this->snapshot($this->pdo);
        $backup = $this->directory.'/incomplete.sqlite';
        self::assertSame(1, $this->reset($backup)->getExitCode());
        self::assertSame($before, $this->snapshot($this->pdo));
        self::assertFileExists($backup);
    }

    public function test_locked_valid_database_does_not_clear_data(): void
    {
        $this->pdo->exec('PRAGMA journal_mode=WAL');
        $before = $this->snapshot($this->pdo);
        $this->pdo->exec('BEGIN EXCLUSIVE');
        try {
            $process = $this->reset($this->directory.'/locked.sqlite');
            self::assertSame(1, $process->getExitCode());
            self::assertStringContainsString('database is locked', strtolower($process->getOutput().$process->getErrorOutput()));
        } finally {
            $this->pdo->exec('ROLLBACK');
        }
        self::assertSame($before, $this->snapshot($this->pdo));
        self::assertSame($before, $this->snapshot(new PDO('sqlite:file:'.$this->directory.'/locked.sqlite?immutable=1')));
    }

    public function test_process_uses_isolated_connection_despite_inherited_url_and_cache(): void
    {
        $decoy = $this->directory.'/decoy.sqlite';
        $this->pdo->exec('VACUUM INTO '.$this->pdo->quote($decoy));
        $decoyBefore = $this->snapshot(new PDO('sqlite:'.$decoy));
        $cache = $this->directory.'/decoy-config.php';
        file_put_contents($cache, '<?php throw new RuntimeException("decoy cache loaded");');
        $oldEnvironment = $_ENV;
        $oldServer = $_SERVER;
        $oldUrl = getenv('DB_URL');
        $oldCache = getenv('APP_CONFIG_CACHE');
        $conflict = ['DB_URL' => 'sqlite:///'.$decoy, 'APP_CONFIG_CACHE' => $cache];
        foreach ($conflict as $key => $value) {
            putenv($key.'='.$value);
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
        try {
            $probe = new Process([PHP_BINARY, '-r', 'echo json_encode(["DB_URL" => getenv("DB_URL"), "APP_CONFIG_CACHE" => getenv("APP_CONFIG_CACHE")]);']);
            $probe->mustRun();
            self::assertSame($conflict, json_decode($probe->getOutput(), true));
            $process = $this->reset($this->directory.'/backup.sqlite');
            self::assertSame(0, $process->getExitCode(), $process->getOutput());
            self::assertStringContainsString($this->database, $process->getOutput());
            self::assertSame($decoyBefore, $this->snapshot(new PDO('sqlite:'.$decoy)));
        } finally {
            $_ENV = $oldEnvironment;
            $_SERVER = $oldServer;
            putenv($oldUrl === false ? 'DB_URL' : 'DB_URL='.$oldUrl);
            putenv($oldCache === false ? 'APP_CONFIG_CACHE' : 'APP_CONFIG_CACHE='.$oldCache);
        }
    }

    public function test_schema_protects_related_records_from_parent_deletion(): void
    {
        $this->assertNoDeleteCascades();
        $this->assertForeignKeysMatch(true, true);
        $before = $this->snapshot($this->pdo);
        foreach (['shop', 'promotion', 'city', 'category', 'moonshine_user_roles'] as $table) {
            try {
                $this->pdo->exec('DELETE FROM "'.$table.'"');
                self::fail('Parent deletion must be refused: '.$table);
            } catch (\PDOException $error) {
                self::assertSame('23000', $error->getCode());
            }
            self::assertSame($before, $this->snapshot($this->pdo));
        }
    }

    #[DataProvider('migrationModes')]
    public function test_migration_cycle_preserves_rows_indexes_and_historical_ids(bool $legacy, bool $emptyVideo): void
    {
        $paths = ['--realpath', '--path='.$this->canonicalMigration()];
        if ($legacy) {
            $paths[] = '--path='.$this->legacyMigration();
            $legacyBefore = $this->migrationData();
            $legacyIndexes = $this->indexes();
            $this->runArtisan(['migrate', '--force', '--realpath', '--path='.$this->legacyMigration()])->mustRun();
            self::assertSame($legacyBefore, $this->migrationData());
            self::assertSame($legacyIndexes, $this->indexes());
        } else {
            $this->pdo->exec('DROP TABLE promotion_image');
        }
        if ($emptyVideo) {
            $this->pdo->exec('DELETE FROM shop_gallery_video');
        }
        $this->assertForeignKeysMatch($legacy, true);
        $this->pdo->exec("UPDATE sqlite_sequence SET seq=seq+100 WHERE name <> 'migrations'");
        $before = $this->migrationData();
        $indexes = $this->indexes();
        $applied = $this->pdo->query('SELECT migration FROM migrations ORDER BY migration')->fetchAll(PDO::FETCH_COLUMN);
        $historic = (int) $this->pdo->query("SELECT seq FROM sqlite_sequence WHERE name='shop_gallery_video'")->fetchColumn();
        $this->pdo->exec('VACUUM INTO '.$this->pdo->quote($this->directory.'/'.date('Ymd-His').'.database.sqlite'));
        $this->runArtisan(['migrate:rollback', '--force', '--step='.($legacy ? 2 : 1), ...$paths])->mustRun();
        self::assertSame($before, $this->migrationData());
        self::assertSame($indexes, $this->indexes());
        $this->assertForeignKeysMatch($legacy, false);
        $this->runArtisan(['migrate', '--force', ...$paths])->mustRun();
        $this->assertNoDeleteCascades();
        $this->assertForeignKeysMatch($legacy, true);
        self::assertSame([], $this->pdo->query('PRAGMA foreign_key_check')->fetchAll());
        self::assertSame($before, $this->migrationData());
        self::assertSame($indexes, $this->indexes());
        self::assertSame($applied, $this->pdo->query('SELECT migration FROM migrations ORDER BY migration')->fetchAll(PDO::FETCH_COLUMN));
        $this->insert('shop_gallery_video', ['shop_id' => 1, 'file_path' => 'next.mp4', 'poster_path' => 'next.jpg', 'mime' => 'video/mp4']);
        self::assertGreaterThan($historic, (int) $this->pdo->lastInsertId());
    }

    public static function migrationModes(): array
    {
        return [
            'canonical populated' => [false, false],
            'canonical empty' => [false, true],
            'legacy populated' => [true, false],
            'legacy empty' => [true, true],
        ];
    }

    public function test_failed_migration_restores_prior_schema_and_foreign_key_enforcement(): void
    {
        $this->runArtisan(['migrate:rollback', '--force', '--step=1', '--realpath', '--path='.$this->canonicalMigration()])->mustRun();
        $this->pdo->exec('DROP TABLE shop_feature');
        $before = $this->snapshot($this->pdo);
        $this->pdo->exec('VACUUM INTO '.$this->pdo->quote($this->directory.'/'.date('Ymd-His').'.database.sqlite'));
        $code = <<<'PHP'
require $argv[1].'/vendor/autoload.php';
$app = require $argv[1].'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
try {
    (require $argv[2])->up();
} catch (\Throwable $error) {
    echo 'foreign_keys='.\Illuminate\Support\Facades\DB::connection()->scalar('PRAGMA foreign_keys');
    fwrite(STDERR, $error->getMessage());
    exit(1);
}
PHP;
        $root = dirname(__DIR__, 3);
        $process = new Process([PHP_BINARY, '-d', 'opcache.jit=0', '-r', $code, $root, $this->canonicalMigration()], $root, $this->processEnvironment(), timeout: 30);
        $process->run();
        self::assertSame(1, $process->getExitCode());
        self::assertStringContainsString('shop_feature', $process->getErrorOutput());
        self::assertSame('foreign_keys=1', $process->getOutput());
        self::assertSame($before, $this->snapshot($this->pdo));
    }

    private function canonicalMigration(): string
    {
        return dirname(__DIR__, 5).'/packages/SchemaDefinition/database/migrations/2026_10_28_030000_restrict_delete_rules.php';
    }

    private function legacyMigration(): string
    {
        return dirname(__DIR__, 5).'/packages/SchemaDefinition/database/legacy-migrations/2026_10_28_030100_restrict_legacy_promotion_image_delete.php';
    }

    private function assertNoDeleteCascades(): void
    {
        self::assertSame([], $this->pdo->query("SELECT m.name, f.[from] FROM sqlite_schema m JOIN pragma_foreign_key_list(m.name) f WHERE m.type='table' AND f.on_delete='CASCADE'")->fetchAll(PDO::FETCH_ASSOC));
    }

    private function assertForeignKeysMatch(bool $legacy, bool $restricted): void
    {
        $rule = $restricted ? 'RESTRICT' : 'CASCADE';
        $definitions = [
            ['moonshine_users', 'moonshine_user_role_id', 'moonshine_user_roles', $rule, 'CASCADE'],
            ['shop', 'city_id', 'city', 'NO ACTION', 'NO ACTION'],
            ['shop_category', 'category_id', 'category', 'NO ACTION', 'NO ACTION'],
            ['shop_category', 'shop_id', 'shop', $rule, 'NO ACTION'],
            ['shop_feature', 'feature_id', 'feature', 'NO ACTION', 'NO ACTION'],
            ['shop_feature', 'shop_id', 'shop', $rule, 'NO ACTION'],
            ['shop_contact', 'contact_type_id', 'contact_type', 'NO ACTION', 'NO ACTION'],
            ['shop_contact', 'shop_id', 'shop', $rule, 'NO ACTION'],
            ['shop_gallery_image', 'shop_id', 'shop', $rule, 'NO ACTION'],
            ['shop_schedule', 'shop_id', 'shop', $rule, 'NO ACTION'],
            ['promotion', 'shop_id', 'shop', $rule, 'NO ACTION'],
            ['promotion_gallery_image', 'promotion_id', 'promotion', $rule, 'NO ACTION'],
            ['shop_gallery_video', 'shop_id', 'shop', $rule, 'NO ACTION'],
            ['promotion_gallery_video', 'promotion_id', 'promotion', $rule, 'NO ACTION'],
        ];
        if ($legacy) {
            $definitions[] = ['promotion_image', 'promotion_id', 'promotion', $rule, 'NO ACTION'];
        }
        $expected = [];
        foreach ($definitions as [$child, $column, $parent, $delete, $update]) {
            $expected[$child.':'.$column] = [$parent, 'id', $delete, $update];
        }
        ksort($expected);
        $actual = [];
        $rows = $this->pdo->query("SELECT m.name, f.[from], f.[table], f.[to], f.on_delete, f.on_update FROM sqlite_schema m JOIN pragma_foreign_key_list(m.name) f WHERE m.type='table'")->fetchAll(PDO::FETCH_ASSOC);
        self::assertCount(count($expected), $rows);
        foreach ($rows as $row) {
            $actual[$row['name'].':'.$row['from']] = [$row['table'], $row['to'], $row['on_delete'], $row['on_update']];
        }
        ksort($actual);
        self::assertSame($expected, $actual);
    }

    private function migrationData(): array
    {
        $data = $this->snapshot($this->pdo)['data'];
        unset($data['migrations']);
        $data['sqlite_sequence'] = array_values(array_filter($data['sqlite_sequence'], static fn (array $row): bool => $row['name'] !== 'migrations'));
        usort($data['sqlite_sequence'], static fn (array $a, array $b): int => $a['name'] <=> $b['name']);

        return $data;
    }

    private function indexes(): array
    {
        $result = [];
        foreach ($this->pdo->query("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN) as $table) {
            foreach ($this->pdo->query('PRAGMA index_list('.$this->pdo->quote($table).')')->fetchAll(PDO::FETCH_ASSOC) as $index) {
                $columns = $this->pdo->query('PRAGMA index_info('.$this->pdo->quote($index['name']).')')->fetchAll(PDO::FETCH_ASSOC);
                $result[$index['name']] = ['table' => $table, 'unique' => $index['unique'], 'columns' => array_column($columns, 'name')];
            }
        }
        ksort($result);

        return $result;
    }

    private function reset(string $backup, bool $purgeCities = false): Process
    {
        $arguments = ['autoteka:business:reset', '--backup='.$backup];
        if ($purgeCities) {
            $arguments[] = '--purge-cities';
        }
        $process = $this->runArtisan($arguments);
        $process->run();

        return $process;
    }

    private function runArtisan(array $arguments): Process
    {
        return new Process(
            [PHP_BINARY, '-d', 'opcache.jit=0', dirname(__DIR__, 3).'/artisan', ...$arguments],
            dirname(__DIR__, 3),
            $this->processEnvironment(),
            timeout: 30,
        );
    }

    private function processEnvironment(): array
    {
        return [
            'APP_ENV' => 'testing',
            'APP_CONFIG_CACHE' => $this->directory.'/unused-config.php',
            'APP_KEY' => 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
            'DB_CONNECTION' => 'sqlite',
            'DB_DATABASE' => $this->database,
            'DB_URL' => '',
            'CACHE_STORE' => 'array',
            'SESSION_DRIVER' => 'array',
            'LOG_CHANNEL' => 'stderr',
        ];
    }

    private function snapshot(PDO $pdo): array
    {
        $result = ['schema' => $pdo->query('SELECT name, sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY name')->fetchAll(PDO::FETCH_ASSOC), 'data' => []];
        foreach ($pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN) as $table) {
            $result['data'][$table] = $pdo->query('SELECT * FROM "'.$table.'" ORDER BY rowid')->fetchAll(PDO::FETCH_ASSOC);
        }

        return $result;
    }

    private function insert(string $table, array $data): void
    {
        $columns = array_keys($data);
        $statement = $this->pdo->prepare('INSERT INTO "'.$table.'" ("'.implode('","', $columns).'") VALUES ('.implode(',', array_fill(0, count($columns), '?')).')');
        $statement->execute(array_values($data));
    }

    private function seed(): void
    {
        foreach ([1, 2] as $id) {
            $this->insert('city', ['id' => $id, 'code' => 'city-'.$id, 'title' => 'Город '.$id]);
            foreach (['category', 'feature', 'contact_type'] as $table) {
                $this->insert($table, ['id' => $id, 'code' => $table.'-'.$id, 'title' => $table, 'is_published' => $id === 1 ? 1 : 0]);
            }
            $this->insert('shop', ['id' => $id, 'code' => 'shop-'.$id, 'title' => 'Магазин', 'city_id' => $id, 'is_published' => $id === 1 ? 1 : 0]);
            $this->insert('shop_category', ['shop_id' => $id, 'category_id' => $id]);
            $this->insert('shop_feature', ['shop_id' => $id, 'feature_id' => $id]);
            $this->insert('shop_contact', ['shop_id' => $id, 'contact_type_id' => $id, 'value' => 'contact']);
            $this->insert('shop_schedule', ['shop_id' => $id, 'weekday' => 1, 'time_from' => '09:00', 'time_to' => '18:00']);
            $this->insert('shop_gallery_image', ['shop_id' => $id, 'file_path' => 'shop-'.$id.'.jpg']);
            $this->insert('shop_gallery_video', ['shop_id' => $id, 'file_path' => 'shop-'.$id.'.mp4', 'poster_path' => 'poster.jpg', 'mime' => 'video/mp4']);
            $this->insert('promotion', ['id' => $id, 'shop_id' => $id, 'code' => 'promo-'.$id, 'title' => 'Акция', 'description' => 'Описание', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31', 'is_published' => $id === 1 ? 1 : 0]);
            foreach (['promotion_image', 'promotion_gallery_image'] as $table) {
                $this->insert($table, ['promotion_id' => $id, 'file_path' => $table.$id.'.jpg']);
            }
            $this->insert('promotion_gallery_video', ['promotion_id' => $id, 'file_path' => 'promo-'.$id.'.mp4', 'poster_path' => 'poster.jpg', 'mime' => 'video/mp4']);
        }
        foreach (['category', 'feature', 'contact_type'] as $table) {
            $this->insert($table, ['id' => 3, 'code' => 'unused', 'title' => 'Несвязанный']);
        }
        $this->insert('users', ['name' => 'Пользователь', 'email' => 'user@example.test', 'password' => 'hash']);
        $this->insert('password_reset_tokens', ['email' => 'user@example.test', 'token' => 'token']);
        $this->insert('moonshine_users', ['moonshine_user_role_id' => 1, 'name' => 'Оператор', 'email' => 'operator@example.test', 'password' => password_hash('test-password', PASSWORD_BCRYPT)]);
        $this->insert('sessions', ['id' => 'session', 'payload' => 'payload', 'last_activity' => 1]);
        $this->insert('notifications', ['id' => 'notification', 'type' => 'test', 'notifiable_type' => 'user', 'notifiable_id' => 1, 'data' => '{}']);
        $this->insert('cache', ['key' => 'key', 'value' => 'value', 'expiration' => 1]);
        $this->insert('cache_locks', ['key' => 'key', 'owner' => 'owner', 'expiration' => 1]);
        $this->insert('jobs', ['queue' => 'default', 'payload' => '{}', 'attempts' => 0, 'available_at' => 1, 'created_at' => 1]);
        $this->insert('job_batches', ['id' => 'batch', 'name' => 'batch', 'total_jobs' => 1, 'pending_jobs' => 1, 'failed_jobs' => 0, 'failed_job_ids' => '[]', 'created_at' => 1]);
        $this->insert('failed_jobs', ['uuid' => 'failed', 'connection' => 'sqlite', 'queue' => 'default', 'payload' => '{}', 'exception' => 'test']);
    }
}
