# Руководство оператора ПК (Clerc) по данным каталога

**Дата актуализации: 2026-03-07.**

Документ описывает операционные действия с данными каталога:

- подготовка и проверка данных;
- публикация данных в backend;
- контроль качества после публикации.

## 1. Зона ответственности

Оператор (clerc) отвечает за:

- корректность справочников (города, категории, фишки, типы
  контактов);
- корректность карточек магазинов;
- проверку медиа и контактов перед публикацией;
- подтверждение, что данные отображаются во front office.

## 2. Источники данных

Основные источники в репозитории:

- `frontend/src/mocks/city-list.json`
- `frontend/src/mocks/category-list.json`
- `frontend/src/mocks/feature-list.json`
- `frontend/src/mocks/shops.json`
- `frontend/public/generated/*` (изображения)

## 3. Проверка данных перед публикацией

Выполнить из `frontend/`:

```bash
npm run validate:mocks
npm run check:unused-assets
npm run check:data
```

Если есть ошибки, публикацию не выполнять до исправления.

## 4. Публикация данных в backend

Публикация выполняется на сервере через контейнер `php`:

```bash
docker compose -f deploy/runtime/docker-compose.yml exec php php artisan autoteka:data:import <scope> --mode=<dry-run|refresh|append> --file=/var/www/frontend/src/mocks/<файл> [--generated-root=/var/www/frontend/public/generated]
```

Scope и файлы: `city` → `city-list.json`, `category` →
`category-list.json`, `feature` → `feature-list.json`, `shop` →
`shops.json`.

Для `scope=shop` параметр
`--generated-root=/var/www/frontend/public/generated` обязателен.

## 5. Рабочая инструкция (полный цикл)

Ниже описан полный практический цикл публикации данных, где фронтовые
команды подготавливают файлы и мок-данные, а backend-команды фиксируют
состояние в БД и media storage.

### 5.1. Подготовка media и моков (frontend)

Выполнять из `frontend/`:

```bash
npm run images:regen
npm run images:moonshine
npm run materialize:shop-media
npm run check:data
```

Что происходит:

- `images:regen` — пересоздаёт набор изображений в
  `frontend/public/generated`;
- `images:moonshine` — конвертирует `generated/*.svg` в
  `generated/*.png` и обновляет ссылки в
  `frontend/src/mocks/shops.json`;
- `materialize:shop-media` — детерминированно проставляет
  `thumbUrl/galleryImages` в `shops.json`;
- `check:data` — выполняет контроль целостности моков и ассетов.

Для импорта `shop` укажите `--generated-root` на каталог
`frontend/public/generated` (или путь внутри контейнера).

### 5.2. Публикация в backend (БД + media)

На сервере, из корня проекта:

1. Проверить импорт на `dry-run`:

```bash
docker compose -f deploy/runtime/docker-compose.yml exec php php artisan autoteka:data:import <scope> --mode=dry-run --file=/var/www/frontend/src/mocks/<файл> [--generated-root=/var/www/frontend/public/generated]
```

1. Если отчёт корректный — выполнить рабочий импорт:

```bash
docker compose -f deploy/runtime/docker-compose.yml exec php php artisan autoteka:data:import <scope> --mode=<refresh|append> --file=/var/www/frontend/src/mocks/<файл> [--generated-root=/var/www/frontend/public/generated]
```

Файлы: `city-list.json`, `category-list.json`, `feature-list.json`,
`shops.json`.

Правила:

- для `scope=shop` параметр
  `--generated-root=/var/www/frontend/public/generated` обязателен;
- `dry-run` не сохраняет изменения в БД;
- `refresh` очищает и перезаписывает scope;
- `append` только добавляет данные.

### 5.3. Исправление путей media (shops/thumbs, shops/gallery)

Если в БД есть пути `generated/*` или `shops/*/generated/*`,
выполнить:

```bash
docker compose -f deploy/runtime/docker-compose.yml exec php php artisan autoteka:media:fix-shops-paths --dry-run
docker compose -f deploy/runtime/docker-compose.yml exec php php artisan autoteka:media:fix-shops-paths
```

Команда переносит файлы в `shops/thumbs/` и `shops/gallery/`,
обновляет пути в БД. В `--dry-run` только показывает план изменений.

## 6. Рекомендуемая последовательность

1. Проверить моки и медиа в frontend.
2. Запустить `dry-run` импорт для нужного scope.
3. Проверить отчёт команды (добавленные/удалённые записи).
4. Выполнить `refresh` или `append`.
5. Проверить front office (`/`) и карточки (`/shop/:code`).
6. Проверить back office (`/admin/login`) и preview изображений.

## 7. Критерии качества публикации

После публикации:

- список городов/категорий/фишек доступен через API `/api/v1/*-list`;
- карточка магазина открывается по `/shop/:code`;
- контакты не дублируются и отдаются в допустимых типах;
- изображения доступны по `/storage/*` и не отдаются как SPA HTML;
- preview в MoonShine отображает актуальные PNG-файлы.

## 8. Эскалация проблем

Если обнаружены расхождения:

- сохранить `code` магазина или scope импорта;
- приложить вывод команды импорта;
- передать информацию администратору для проверки backend/deploy.

Смежные документы:

- `docs/foundations/ADMIN_MANUAL.md`
- `docs/foundations/IMPLEMENTATION.md`
- `deploy/DEPLOY.md`
