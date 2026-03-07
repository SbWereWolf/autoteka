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
docker compose -f deploy/docker-compose.yml exec php php artisan autoteka:data:import <scope> --mode=<dry-run|refresh|append> --file=<path>
```

Scope:

- `city`
- `category`
- `feature`
- `shop`

Для `shop` дополнительно требуется `--generated-root=<path>`.

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

Если используется серверный backend, после подготовки синхронизировать
ассеты в backend storage:

```bash
npm run sync:backend-media
```

### 5.2. Публикация в backend (БД + media)

На сервере, из корня проекта:

1. Проверить импорт на `dry-run`:

```bash
docker compose -f deploy/docker-compose.yml exec php php artisan autoteka:data:import <scope> --mode=dry-run --file=<path> [--generated-root=<path>]
```

1. Если отчёт корректный — выполнить рабочий импорт:

```bash
docker compose -f deploy/docker-compose.yml exec php php artisan autoteka:data:import <scope> --mode=<refresh|append> --file=<path> [--generated-root=<path>]
```

Правила:

- для `scope=shop` параметр `--generated-root` обязателен;
- `dry-run` не сохраняет изменения в БД;
- `refresh` очищает и перезаписывает scope;
- `append` только добавляет данные.

### 5.3. Приведение путей media к PNG и preview для MoonShine

Если в БД уже есть исторические ссылки на `generated/*.svg`,
выполнить:

```bash
docker compose -f deploy/docker-compose.yml exec php php artisan autoteka:media:update-generated-paths-to-png --dry-run
docker compose -f deploy/docker-compose.yml exec php php artisan autoteka:media:update-generated-paths-to-png
```

Команда:

- переводит пути `generated/*.svg` -> `generated/*.png` в SQLite;
- подготавливает preview-копии для MoonShine;
- в `--dry-run` только показывает план изменений.

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
