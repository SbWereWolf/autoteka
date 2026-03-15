# Э4 — чеклист реализации автотестов

## Область

- Этап: Э4 (проверка утверждений документации через тесты)
- Обновляется по мере реализации каждого тест-кейса

## Сводка

- **Реализовано:** ~60 тест-кейсов (частично или полностью)
- **Отложено:** 8 тест-кейсов
- **Осталось:** ~58 (E2E, UI, интеграционные)

## Таблица соответствия: тест-кейс → файл → команда

| Тест-кейс                                  | Файл теста                                                               | Команда запуска                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| TC-README-001                              | system-tests/TC-README-001.spec.ts                                       | `cd system-tests && npm test -- TC-README-001`                                                     |
| TC-README-002                              | system-tests/TC-README-002.spec.ts                                       | `cd system-tests && npm test -- TC-README-002`                                                     |
| TC-README-003                              | frontend/tests/TC-README-003.spec.ts                                     | `cd frontend && npm test -- tests/TC-README-003`                                                   |
| TC-README-004                              | frontend/tests/TC-README-004.spec.ts, frontend/e2e/TC-README-004.spec.ts | `cd frontend && npm test -- tests/TC-README-004` + `npm run test:e2e -- e2e/TC-README-004.spec.ts` |
| TC-README-005                              | frontend/tests/TC-README-005.spec.ts                                     | `cd frontend && npm test -- tests/TC-README-005`                                                   |
| TC-README-006                              | backend/tests/Feature/TcReadme006Test.php                                | `cd backend && php artisan test --filter=TcReadme006`                                              |
| TC-README-007                              | backend/tests/Feature/TcReadme007Test.php                                | `cd backend && php artisan test --filter=TcReadme007`                                              |
| TC-README-008                              | backend/tests/Feature/TcReadme008Test.php                                | `cd backend && php artisan test --filter=TcReadme008`                                              |
| TC-README-009                              | system-tests/TC-README-009.spec.ts                                       | `cd system-tests && npm test -- TC-README-009`                                                     |
| TC-BACKEND-README-001..010                 | backend/tests/Feature/TcBackendReadmeTest.php                            | `cd backend && php artisan test --filter=TcBackendReadme`                                          |
| TC-BACKEND-README-011                      | system-tests/TC-BACKEND-README-011.spec.ts                               | `cd system-tests && npm test -- TC-BACKEND`                                                        |
| TC-DEPLOY-001                              | infrastructure/tests/TC-DEPLOY-001.spec.ts                                       | `cd infrastructure/tests && npm test -- TC-DEPLOY-001`                                                     |
| TC-DEPLOY-002                              | infrastructure/tests/TC-DEPLOY-002.spec.ts                                       | `cd infrastructure/tests && npm test -- TC-DEPLOY-002`                                                     |
| TC-DEPLOY-004                              | infrastructure/tests/TC-DEPLOY-004.spec.ts                                       | `cd infrastructure/tests && npm test -- TC-DEPLOY-004`                                                     |
| TC-DEPLOY-005                              | infrastructure/tests/TC-DEPLOY-005.spec.ts                                       | `cd infrastructure/tests && npm test -- TC-DEPLOY-005`                                                     |
| TC-DEPLOY-007                              | infrastructure/tests/TC-DEPLOY-007.spec.ts                                       | `cd infrastructure/tests && npm test -- TC-DEPLOY-007`                                                     |
| TC-DEPLOY-008                              | infrastructure/tests/TC-DEPLOY-008.spec.ts                                       | `cd infrastructure/tests && npm test -- TC-DEPLOY-008`                                                     |
| TC-DEPLOY-011                              | backend/tests/Feature/TcDeploy011Test.php                                | `cd backend && php artisan test --filter=TcDeploy011`                                              |
| TC-DEPLOY-018                              | infrastructure/tests/TC-DEPLOY-018.spec.ts                                       | `cd infrastructure/tests && npm test -- TC-DEPLOY-018`                                                     |
| TC-DEPLOY-019                              | infrastructure/tests/TC-DEPLOY-019.spec.ts                                       | `cd infrastructure/tests && npm test -- TC-DEPLOY-019`                                                     |
| TC-DEPLOY-020                              | infrastructure/tests/TC-DEPLOY-020.spec.ts                                       | `cd infrastructure/tests && npm test -- TC-DEPLOY-020`                                                     |
| TC-DEPLOY-021                              | backend/tests/Feature/TcDeploy021Test.php                                | `cd backend && php artisan test --filter=TcDeploy021`                                              |
| TC-DEPLOY-022                              | infrastructure/tests/TC-DEPLOY-022.spec.ts                                       | `cd infrastructure/tests && npm test -- TC-DEPLOY-022`                                                     |
| TC-FRONTEND-README-001,003,004,005,006,007 | frontend/tests/TC-FRONTEND-README.spec.ts                                | `cd frontend && npm test -- tests/TC-FRONTEND`                                                     |
| TC-FRONTEND-README-009                     | system-tests/TC-FRONTEND-README-009.spec.ts                              | `cd system-tests && npm test -- TC-FRONTEND`                                                       |
| TC-FSCRIPTS-README-001,009, validate/check | frontend/tests/TC-FSCRIPTS-README.spec.ts                                | `cd frontend && npm test -- tests/TC-FSCRIPTS`                                                     |
| TC-SCRIPTS-README-001,002,003,007,008,009  | system-tests/TC-SCRIPTS-README.spec.ts                                   | `cd system-tests && npm test -- TC-SCRIPTS`                                                        |
| TC-ADMIN-MANUAL-012                        | infrastructure/tests/TC-ADMIN-MANUAL-012.spec.ts                                 | `cd infrastructure/tests && npm test -- TC-ADMIN`                                                          |
| TC-CLERC-MANUAL-001                        | system-tests/TC-CLERC-MANUAL-001.spec.ts                                 | `cd system-tests && npm test -- TC-CLERC`                                                          |
| TC-CLERC-MANUAL-014                        | system-tests/TC-CLERC-MANUAL-014.spec.ts                                 | `cd system-tests && npm test -- TC-CLERC`                                                          |
| TC-IMPLEMENTATION-001                      | system-tests/TC-IMPLEMENTATION-001.spec.ts                               | `cd system-tests && npm test -- TC-IMPLEMENTATION`                                                 |
| TC-USER-MANUAL-012                         | system-tests/TC-USER-MANUAL-012.spec.ts                                  | `cd system-tests && npm test -- TC-USER`                                                           |

## Запуск всех Э4-тестов

### Параллельно (из корня репозитория)

Требуется `concurrently` (через `npx`):

```bash
npx concurrently -k --names "system,deploy,frontend-offline-ui,frontend-api-online,frontend-e2e-online,backend,backend-realdb" \
  "cd system-tests && npm test" \
  "cd infrastructure/tests && npm test" \
  "cd frontend && npm run test && npm run test:ui:mock" \
  "cd frontend && npm run test:api:online" \
  "cd frontend && npm run test:e2e" \
  "cd backend && php artisan test" \
  "cd backend && php artisan test --configuration=phpunit.realdb.xml"
```

PowerShell (из корня):

```powershell
npx concurrently -k --names "system,deploy,frontend-offline-ui,frontend-api-online,frontend-e2e-online,backend,backend-realdb" "cd system-tests; npm test" "cd infrastructure/tests; npm test" "cd frontend; npm run test; npm run test:ui:mock" "cd frontend; npm run test:api:online" "cd frontend; npm run test:e2e" "cd backend; php artisan test" "cd backend; php artisan test --configuration=phpunit.realdb.xml"
```

### Последовательно

```bash
cd system-tests && npm test && \
cd ../infrastructure/tests && npm test && \
cd ../../frontend && npm run test && npm run test:ui:mock && npm run test:api:online && npm run test:e2e && \
cd ../backend && php artisan test && php artisan test --configuration=phpunit.realdb.xml
```

PowerShell:

```powershell
cd system-tests; npm test; cd ..\infrastructure\tests; npm test; cd ..\..\frontend; npm run test; npm run test:ui:mock; npm run test:api:online; npm run test:e2e; cd ..\backend; php artisan test; php artisan test --configuration=phpunit.realdb.xml
```

### По отдельности

```bash
# system-tests
cd system-tests && npm test

# infrastructure/tests
cd infrastructure/tests && npm test

# frontend offline (unit + UI на mock-данных)
cd frontend && npm run test && npm run test:ui:mock

# frontend API online (требует работающий backend/API)
cd frontend && npm run test:api:online

# frontend online e2e (требует установленный контур frontend+backend)
cd frontend && npm run test:e2e

# backend (полный + real-db)
cd backend && php artisan test && php artisan test --configuration=phpunit.realdb.xml
```

## Отложенные тест-кейсы (невозможно в разумные сроки)

| Тест-кейс           | Утверждение (кратко)                                       | Причина отложения                                 |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| TC-README-010       | Server-side env `/etc/autoteka/options.env`, `telegram.env` | Требуется целевой сервер с установленным deploy   |
| TC-DEPLOY-009       | `install.sh` устанавливает пакеты, unit'ы, timer'ы         | Полная установка на «чистый стенд»                |
| TC-DEPLOY-010       | Проверка `autoteka.service`, timer'ов, compose `ps`        | `systemctl` и `docker compose` на реальном хосте  |
| TC-DEPLOY-014       | `/metrics/data.json` из watchdog + metrics-export          | Нужен запущенный deploy-контур и watchdog         |
| TC-DEPLOY-016       | Telegram lock-механизм                                     | Внешняя зависимость Telegram API                  |
| TC-DEPLOY-017       | Любое Telegram-уведомление (hash + subject)                   | Внешняя зависимость Telegram API                  |
| TC-DEPLOY-022       | `uninstall.sh` режимы soft/purge/nuke                      | Деструктивные операции, нужен изолированный стенд |
| TC-CLERC-MANUAL-013 | Эскалация: оператор передаёт code/scope и вывод            | Процессный сценарий, не runtime                   |

## Список тест-кейсов (статус ☐/☑)

### README.md: ☑ 1–5, 6–9 | ☐ — | ОТЛОЖЕН 10

### backend/README.md: ☑ 11–21 | ☐ —

### infrastructure/DEPLOY.md: ☑ 22,23,25,26,28,29,32,39,40,41,42,43 | ☐ 24,27,33,34,36 | ОТЛОЖЕН 30,31,35,37,38,43

### frontend/README.md: ☑ 44,46,47,48,49,50,51,52 | ☐ 45,51 (e2e)

### frontend/scripts/README.md: ☑ 53,61 + smoke | ☐ 54–60

### scripts/README.md: ☑ 62,63,64,67,68,69 | ☐ 65,66

### ADMIN_MANUAL.md: ☑ 82 | ☐ 71–81,83,84

### CLERC_MANUAL.md: ☑ 85,98 | ☐ 86–97 | ОТЛОЖЕН 97

### IMPLEMENTATION.md: ☑ 99 | ☐ 100–114

### USER_MANUAL.md: ☑ 126 | ☐ 115–125
