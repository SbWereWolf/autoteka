# frontend/scripts/

Фронтовые утилиты проекта (Node `.mjs`). Запускаются **из каталога
`frontend/`**.

## Состав

- `generate-shop-images.mjs` — генерация изображений магазинов в
  `frontend/public/generated`.
- `convert-generated-images-for-moonshine.mjs` — конвертирует
  `frontend/public/generated/*.svg` в `.png` и обновляет ссылки в
  `frontend/src/mocks/shops.json`.
- `materialize-shop-media.mjs` — детерминированно записывает
  `thumbUrl/galleryImages` в `frontend/src/mocks/shops.json`.
- `validate-mocks.mjs` — валидация мок-данных и связанных ассетов.
- `enrich-mocks.mjs` — обогащение моков (если используется в
  сценариях).
- `check-unused-assets.mjs` — проверка лишних/отсутствующих файлов в
  `frontend/public/generated`.
- `sync-generated-to-backend.mjs` — синхронизирует ассеты из
  `frontend/public/generated` в
  `backend/storage/app/public/generated`.

## Быстрые команды

Из `frontend/`:

```bash
npm run images:regen
npm run images:moonshine
npm run materialize:shop-media
npm run sync:backend-media
npm run check:data
```
