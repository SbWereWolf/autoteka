# Backend workspace

Структура backend после разделения:

- `apps/API` — Laravel 12 приложение, обслуживает только API.
- `apps/DatabaseOperator` — Laravel 12 + MoonShine 4, обслуживает
  только админку.
- `packages/SchemaDefinition` — composer path-package с миграциями и
  enum схемы.
- `database/database.sqlite` — общий SQLite-файл для обоих приложений.

Миграции выполняются из `apps/DatabaseOperator`, seed MoonShine-админа
— из `apps/DatabaseOperator`.
