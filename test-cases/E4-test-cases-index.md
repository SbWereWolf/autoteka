# Э4 — индекс тест-кейсов по документации

## Область

- Источник списка документов: `tasks/artifacts/markdown-files.txt`
- Этап: Э4 (проверка утверждений документации через тесты)
- Статус: test-case артефакты подготовлены по всем файлам Э1

## Список артефактов

1. `tasks/artifacts/README-test-cases.md`
2. `tasks/artifacts/backend-README-test-cases.md`
3. `tasks/artifacts/infrastructure-DEPLOY-test-cases.md`
4. `tasks/artifacts/frontend-README-test-cases.md`
5. `tasks/artifacts/frontend-scripts-README-test-cases.md`
6. `tasks/artifacts/scripts-README-test-cases.md`
7. `tasks/artifacts/ADMIN_MANUAL-test-cases.md`
8. `tasks/artifacts/CLERC_MANUAL-test-cases.md`
9. `tasks/artifacts/IMPLEMENTATION-test-cases.md`
10. `tasks/artifacts/USER_MANUAL-test-cases.md`

## Краткая сводка покрытия

- `system-tests`:
  интеграционные сценарии сквозной проверки документационных утверждений
  (маршруты, связка frontend/backend, media/storage, валидность ссылок).
- `infrastructure/tests`:
  утверждения по deploy-контуру, systemd/timer, watchdog/metrics,
  Telegram notifications, maintenance и uninstall.
- `frontend/tests`:
  UI/UX сценарии front office, состояние/localStorage, команды и data/media
  frontend-утилит.
- `backend/tests`:
  API-контракты, сидирование, MoonShine login/resource, импорт и
  специализированные artisan-команды.

## Примечания по применению

- В каждом файле тест-кейсов есть трассировка:
  `документ -> утверждение -> тест-кейс -> каталог тестов`.
- Условно проверяемые process-утверждения (например, дата актуализации
  документа) выделены отдельно и требуют process-check, а не runtime test.
