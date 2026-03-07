# Э4 — тест-кейсы для frontend/scripts/README.md

## Область

- Документ-источник: `frontend/scripts/README.md`
- Цель: проверить тестами проверяемые утверждения документа
- Формат трассировки:
  `frontend/scripts/README.md -> утверждение -> тест-кейс -> каталог тестов`

## Тест-кейсы

### TC-FSCRIPTS-README-001

- Утверждение: фронтовые утилиты — Node `.mjs` и запускаются из
  каталога `frontend/`.
- Проверка:
  1. Проверить, что перечисленные скрипты имеют расширение `.mjs`.
  2. Запустить команды из `frontend/`.
  3. Проверить, что запуск из другого каталога без корректного cwd
     не является поддерживаемым сценарием.
- Ожидаемый результат:
  утилиты являются `.mjs` и корректно исполняются из `frontend/`.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-FSCRIPTS-README-002

- Утверждение: `generate-shop-images.mjs` генерирует изображения
  магазинов в `frontend/public/generated`.
- Проверка:
  1. Очистить тестовый каталог `frontend/public/generated`.
  2. Запустить генерацию (`npm run images:regen` или прямой вызов скрипта).
  3. Проверить появление сгенерированных файлов.
- Ожидаемый результат:
  в `frontend/public/generated` создаются изображения магазинов.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-FSCRIPTS-README-003

- Утверждение: `convert-generated-images-for-moonshine.mjs`
  конвертирует `*.svg` в `.png` и обновляет ссылки
  в `frontend/src/mocks/shops.json`.
- Проверка:
  1. Подготовить входной набор `.svg` в `frontend/public/generated`.
  2. Запустить `npm run images:moonshine`.
  3. Проверить наличие `.png` и изменения ссылок в `shops.json`.
- Ожидаемый результат:
  SVG конвертируются в PNG, ссылки в моках обновлены.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-FSCRIPTS-README-004

- Утверждение: `materialize-shop-media.mjs` детерминированно записывает
  `thumbUrl/galleryImages` в `frontend/src/mocks/shops.json`.
- Проверка:
  1. Запустить `npm run materialize:shop-media` два раза подряд
     на одинаковом входе.
  2. Сравнить итоговый `shops.json` после обоих запусков.
- Ожидаемый результат:
  результат идентичен между запусками (детерминированность соблюдена).
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-FSCRIPTS-README-005

- Утверждение: `validate-mocks.mjs` валидирует мок-данные
  и связанные ассеты.
- Проверка:
  1. Запустить `npm run validate:mocks` на корректном наборе данных.
  2. Смоделировать некорректный mock/asset и повторить запуск.
- Ожидаемый результат:
  - на валидных данных команда завершается успешно;
  - на ошибочном наборе возвращает диагностическую ошибку.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-FSCRIPTS-README-006

- Утверждение: `enrich-mocks.mjs` выполняет обогащение моков.
- Проверка:
  1. Подготовить минимальный входной набор mock-данных.
  2. Запустить `npm run enrich:mocks`.
  3. Проверить ожидаемые обогащённые поля в результате.
- Ожидаемый результат:
  скрипт добавляет/обновляет поля обогащения согласно логике.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-FSCRIPTS-README-007

- Утверждение: `check-unused-assets.mjs` проверяет
  лишние/отсутствующие файлы в `frontend/public/generated`.
- Проверка:
  1. Смоделировать лишний файл и отсутствие требуемого файла.
  2. Запустить `npm run check:unused-assets`.
  3. Проверить диагностический отчёт.
- Ожидаемый результат:
  скрипт обнаруживает и репортит оба типа проблем.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-FSCRIPTS-README-008

- Утверждение: `sync-generated-to-backend.mjs` синхронизирует ассеты из
  `frontend/public/generated` в
  `backend/storage/app/public/generated`.
- Проверка:
  1. Подготовить тестовый набор ассетов во frontend-каталоге.
  2. Запустить `npm run sync:backend-media`.
  3. Проверить наличие соответствующих файлов в backend-каталоге.
- Ожидаемый результат:
  ассеты синхронизируются в backend storage.
- Тип: automated
- Каталог тестов: `frontend/tests` + `system-tests`

### TC-FSCRIPTS-README-009

- Утверждение: быстрые команды из документа:
  `images:regen`, `images:moonshine`, `materialize:shop-media`,
  `sync:backend-media`, `check:data`.
- Проверка:
  1. Проверить наличие скриптов в `frontend/package.json`.
  2. Выполнить smoke-прогон каждой команды.
- Ожидаемый результат:
  все команды существуют и исполняются без ошибки в поддерживаемом env.
- Тип: automated
- Каталог тестов: `frontend/tests`
