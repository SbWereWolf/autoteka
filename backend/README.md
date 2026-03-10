# Backend workspace

Структура backend после разделения:

- `apps/ShopAPI` — Laravel 12 приложение, обслуживает только API.
- `apps/ShopOperator` — Laravel 12 + MoonShine 4, обслуживает
  только админку.
- `packages/SchemaDefinition` — composer path-package с миграциями и
  enum схемы.
- `database/database.sqlite` — общий SQLite-файл для обоих приложений.

Миграции выполняются из `apps/ShopOperator`, seed MoonShine-админа
— из `apps/ShopOperator`.
