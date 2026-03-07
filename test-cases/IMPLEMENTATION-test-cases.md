# Э4 — тест-кейсы для docs/foundations/IMPLEMENTATION.md

## Область

- Документ-источник: `docs/foundations/IMPLEMENTATION.md`
- Цель: проверить тестами проверяемые утверждения документа
- Формат трассировки:
  `IMPLEMENTATION.md -> утверждение -> тест-кейс -> каталог тестов`

## Тест-кейсы

### TC-IMPLEMENTATION-001

- Утверждение: монорепозиторий содержит зоны
  `frontend/`, `backend/`, `deploy/`.
- Проверка: проверить существование каталогов.
- Ожидаемый результат: все три зоны присутствуют.
- Тип: automated
- Каталог тестов: `system-tests`

### TC-IMPLEMENTATION-002

- Утверждение: frontend — Vue 3 + Vite SPA.
- Проверка:
  1. Проверить `frontend/package.json` на `vue` (major 3) и `vite`.
  2. Проверить, что есть SPA router-конфигурация.
- Ожидаемый результат: стек frontend соответствует документу.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-IMPLEMENTATION-003

- Утверждение: backend — Laravel 12 + MoonShine 4.
- Проверка:
  1. Проверить `backend/composer.json`.
  2. Убедиться в наличии пакетов Laravel 12 и MoonShine major 4.
- Ожидаемый результат: backend-стек соответствует документу.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-IMPLEMENTATION-004

- Утверждение: фронтовые страницы — `/` и `/shop/:code`.
- Проверка: e2e-навигация на маршруты и проверка загрузки экранов.
- Ожидаемый результат: оба маршрута доступны и отображают UI.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-IMPLEMENTATION-005

- Утверждение: перечисленные ключевые компоненты frontend существуют.
- Проверка: проверить наличие файлов компонентов:
  `TopBar`, `HamburgerMenu`, `CitySelect`, `CategoryChips`,
  `FeatureSelect`, `ShopTile`, `GalleryCarousel`, `OverscrollOpenLink`,
  `CssVarsEditor`, `CssVarsEditorVarRow`.
- Ожидаемый результат: все компоненты присутствуют в кодовой базе.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-IMPLEMENTATION-006

- Утверждение: `frontend/src/state.ts` хранит заявленные поля состояния
  и использует ключи localStorage.
- Проверка:
  1. Проверить структуру state и набор полей.
  2. Проверить чтение/запись ключей:
     `autoteka_theme`, `autoteka_city`, `autoteka_categories`,
     `autoteka_feature`, `autoteka_theme_editor_enabled`,
     `autoteka_theme_overrides_v1`.
- Ожидаемый результат:
  состояние и localStorage-ключи соответствуют документу.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-IMPLEMENTATION-007

- Утверждение: frontend поддерживает `MockApiClient` и `HttpApiClient`.
- Проверка:
  1. Проверить наличие обеих реализаций API-клиента.
  2. Проверить переключение режимов через конфигурацию.
- Ожидаемый результат: оба режима доступны и работают.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-IMPLEMENTATION-008

- Утверждение: базовый URL API задаётся через `VITE_API_BASE_URL`,
  default `/api/v1`.
- Проверка:
  1. Проверить чтение env в frontend-клиенте.
  2. Запустить smoke с `VITE_API_BASE_URL=/api/v1`.
  3. Проверить, что запросы идут на `/api/v1/*`.
- Ожидаемый результат:
  API base URL подхватывается из env и работает по default-схеме.
- Тип: automated
- Каталог тестов: `frontend/tests` + `system-tests`

### TC-IMPLEMENTATION-009

- Утверждение: backend API с префиксом `/api/v1` и маршрутами:
  `city-list`, `category-list`, `feature-list`, `city/{code}`,
  `shop/{code}`, `shop/{code}/acceptable-contact-types`.
- Проверка:
  1. Проверить роуты в `backend/routes/api.php`.
  2. Выполнить HTTP-запросы по каждому endpoint.
- Ожидаемый результат: все маршруты доступны и корректно отвечают.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-IMPLEMENTATION-010

- Утверждение: `HttpApiClient` ожидает описанные DTO-форматы и frontend
  нормализует `number|string` id к `string`.
- Проверка:
  1. Запустить unit-тесты маппинга/нормализации.
  2. Проверить преобразование id в строку.
- Ожидаемый результат:
  DTO-маппинг и нормализация соответствуют контракту.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-IMPLEMENTATION-011

- Утверждение: ключевые backend-модели и MoonShine resources присутствуют,
  `ShopResource` использует `SaveShopResourceHandler`.
- Проверка:
  1. Проверить наличие моделей и resource-классов.
  2. Проверить связку `ShopResource` -> `SaveShopResourceHandler`.
- Ожидаемый результат:
  модели/resources и handler подключены согласно документу.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-IMPLEMENTATION-012

- Утверждение: compose-контур поднимает `php` (`autoteka-php`)
  и `web` (`vue-app`), а `web` публикует порт, имеет healthcheck,
  монтирует `deploy/metrics` и раздаёт `/storage/*`.
- Проверка:
  1. Проверить `deploy/docker-compose.yml` и nginx-конфиг.
  2. Поднять контур и проверить `docker compose ps` + `GET /storage/*`.
- Ожидаемый результат:
  compose и web-конфигурация соответствуют заявленному поведению.
- Тип: automated
- Каталог тестов: `deploy/tests` + `system-tests`

### TC-IMPLEMENTATION-013

- Утверждение: установлены заявленные systemd unit/timer, а
  `autoteka-deploy.service` запускает `watch-changes.sh`,
  который стартует `deploy.sh`.
- Проверка:
  1. Проверить unit-файлы.
  2. Проверить цепочку выполнения в логах systemd/deploy.
- Ожидаемый результат:
  unit'ы/timer'ы и цепочка watcher -> deploy работают.
- Тип: automated
- Каталог тестов: `deploy/tests`

### TC-IMPLEMENTATION-014

- Утверждение: watchdog пишет метрики в `/var/log/server-metrics.log`,
  экспортирует JSON, выполняет self-healing в 3 стадии.
- Проверка:
  1. Запустить watchdog и проверить запись метрик/экспорт.
  2. Смоделировать деградацию контейнера и проверить стадии recovery.
- Ожидаемый результат:
  метрики и self-healing работают по описанному алгоритму.
- Тип: automated
- Каталог тестов: `deploy/tests`

### TC-IMPLEMENTATION-015

- Утверждение: maintenance выполняет `apt clean`, `journal vacuum`,
  docker prune, cleanup `/tmp`, фиксацию прав logrotate status.
- Проверка:
  1. Проверить состав шагов в `server-maintenance.sh`.
  2. Выполнить скрипт и проверить логи выполнения.
- Ожидаемый результат: maintenance-сценарий соответствует документу.
- Тип: automated
- Каталог тестов: `deploy/tests`

### TC-IMPLEMENTATION-016

- Утверждение: список проверок раздела 7 исполним:
  frontend (`validate:mocks`, `check:unused-assets`, `check:data`,
  `test`, `test:e2e`), backend (`artisan test`, `migrate`,
  `db:seed --class=AdminUserSeeder`), monorepo (`npm run lint`).
- Проверка:
  1. Проверить наличие соответствующих скриптов/команд.
  2. Выполнить их в поддерживаемом окружении.
- Ожидаемый результат:
  все документированные проверки доступны и запускаются.
- Тип: automated
- Каталог тестов: `system-tests`

## Условно проверяемые утверждения

- Формулировки из раздела "Известные ограничения" проверяются
  частично runtime-тестами, но полноценно требуют process-check
  (например, наличие/отсутствие CI-пайплайна).
- Дата актуализации (`2026-03-07`) подтверждается только
  процессной сверкой артефактов Э3/Э4.
