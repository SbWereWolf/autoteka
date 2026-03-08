# Backend Автотеки

**Актуально по коду на 2026-03-07.**

Backend реализован на Laravel 12 и используется для:

- API front office;
- back office на MoonShine 4;
- хранения и редактирования справочников и магазинов.

## Быстрый запуск

```bash
cd backend
composer install
cp example.env .env
php artisan key:generate
php artisan migrate
php artisan db:seed --class=AdminUserSeeder
php artisan serve
```

## Быстрая проверка гипотез

```shell
php artisan tinker
```

Для работы с БД можно использовать facade
Illuminate\Support\Facades\DB

## Основные URL

- API base: `/api/v1` (см. `backend/routes/api.php` и `frontend/.env`
  с `VITE_API_BASE_URL=/api/v1`)
- MoonShine login: `http://127.0.0.1:8000/admin/login`

## Initial admin

По умолчанию:

- email: `admin@example.com`
- password: `admin12345`

Production-значения задаются через:

- `MOONSHINE_ADMIN_NAME`
- `MOONSHINE_ADMIN_EMAIL`
- `MOONSHINE_ADMIN_PASSWORD`

## Тесты

По умолчанию тесты используют SQLite in-memory (пустая БД). Тесты с
группой `realdb` исключены из стандартного прогона.

Важно: real-db тесты нужно запускать только через
`phpunit.realdb.xml`. Запуск через стандартный `phpunit.xml`
использует `DB_DATABASE=:memory:` и не подходит для проверок на
реальной БД.

Для запуска `PublicApiContractRealDbTest` и `ModelRulesRealDbTest` на
рабочей БД SQLite используйте отдельный конфиг:

```bash
php artisan test --configuration=phpunit.realdb.xml
```

Через Docker:

```bash
docker exec -w /var/www/backend autoteka-php php artisan test --configuration=phpunit.realdb.xml
```

Путь к БД задаётся в `phpunit.realdb.xml`
(`DB_DATABASE=database/database.sqlite`) и должен соответствовать
реальному файлу БД.

Для полной проверки работоспособности запускайте два набора тестов:

```bash
# стандартный набор (phpunit.xml, без realdb)
php artisan test

# realdb-набор (phpunit.realdb.xml)
php artisan test --configuration=phpunit.realdb.xml
```

Желательно выполнять оба набора параллельно:

```bash
php artisan test &
php artisan test --configuration=phpunit.realdb.xml &
wait
```

### Конфигурация phpunit.xml

`backend/phpunit.xml` — стандартный конфиг PHPUnit для тестов.

Основные параметры:

- `bootstrap="vendor/autoload.php"` — точка входа для автозагрузки
  классов. Без этого тесты не смогут найти классы Laravel и
  приложения.
- `testsuites` — определяет, какие тесты запускаются (Unit, Feature).
  Исключение директории приведёт к пропуску тестов. Неправильная
  структура папок — к ошибкам запуска.
- `groups.exclude.realdb` — исключает тесты с группой `realdb` из
  стандартного прогона. Эти тесты требуют реальную БД и запускаются
  отдельно. Без исключения стандартный прогон упадёт из-за отсутствия
  БД.
- `env APP_ENV=testing` — окружение для тестов. Влияет на конфигурацию
  Laravel, отключает некоторые production-фичи. Неправильное значение
  может привести к использованию production-настроек в тестах.
- `env DB_DATABASE=:memory:` — SQLite in-memory база для тестов.
  Быстрая, изолированная, очищается после каждого теста. Не подходит
  для тестов, требующих персистентность данных (группа `realdb`).
- `env CACHE_STORE=array, SESSION_DRIVER=array` — in-memory хранилища
  для тестов. Не требуют внешних сервисов, быстрые, изолированные. Не
  подходят для тестов кеширования/сессий с реальными драйверами.

## Что читать дальше

- `../docs/foundations/IMPLEMENTATION.md` — устройство backend и API.
- `../docs/foundations/ADMIN_MANUAL.md` — работа с back office и
  служебными командами.
- `../deploy/DEPLOY.md` — развёртывание и эксплуатация.
