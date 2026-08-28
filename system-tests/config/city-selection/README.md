# Конфигурации автоматического выбора города

Каждый JSON описывает полный входной сценарий и ожидаемый наблюдаемый
результат. Параметризованный Playwright-тест
`frontend/ui-mock/city-selection-configs.spec.ts` читает все семь файлов и
до загрузки страницы настраивает API mock, `localStorage` и browser
geolocation.

Сценарии:

1. `01-city-list-error.json` — `/city-list` возвращает ошибку; город не
   выбирается, показывается dialog.
2. `02-city-list-empty.json` — `/city-list` возвращает пустой массив; город
   не выбирается, показывается dialog.
3. `03-local-storage-valid.json` — сохранённый `code` существует; выбирается
   сохранённый город, GPS не запрашивается.
4. `04-geolocation-denied.json` — `localStorage` пуст, геолокация запрещена;
   выбирается первый город исходного серверного ответа.
5. `05-geolocation-success-nearest.json` — сохранённый город устарел,
   mock-GPS успешен; выбирается ближайший город.
6. `06-geolocation-success-no-valid-city-coordinates.json` — GPS успешен, но
   координаты городов непригодны; выбирается первый серверный город.
7. `07-geolocation-real.json` — используется настоящий Geolocation API;
   конкретный результат зависит от окружения или provider timeout.

Статус `geolocation.status = error` отдельно покрывается unit-тестом
`frontend/src/utils/userGeolocation.spec.ts`. Пользовательский результат
совпадает с `denied`: используется первый серверный город.

## Поля Geolocation

- `mode: "mock"` — подставить результат в
  `navigator.geolocation.getCurrentPosition()`;
- `mode: "real"` — не подменять Browser Geolocation API;
- `status: "success"` — вернуть `latitude` и `longitude` из конфига;
- `status: "denied"` — имитировать отказ в разрешении;
- `status: "error"` — имитировать техническую ошибку геолокации.

Конфиги не меняют данные БД и не требуют test-only изменений production API.

## Автоматический запуск

Из каталога `frontend/`:

```bash
HOME=/root \
PLAYWRIGHT_BROWSERS_PATH=/path/to/ms-playwright \
npx playwright test \
  --config playwright.ui-mock.config.ts \
  --browser=firefox \
  city-selection-configs.spec.ts
```

Первые шесть сценариев выполняются автоматически. Реальная геолокация
пропускается.

## Opt-In Real Geolocation

Сценарий запускается отдельно в окружении с доступным location provider:

```bash
CITY_SELECTION_REAL_GEOLOCATION=1 \
npm run test:ui:mock:headed -- \
  city-selection-configs.spec.ts \
  --browser=firefox \
  --grep geolocation-real
```

В PowerShell переменная окружения задаётся отдельно:

```powershell
$env:CITY_SELECTION_REAL_GEOLOCATION = "1"
npm run test:ui:mock:headed -- `
  city-selection-configs.spec.ts `
  --browser=firefox `
  --grep geolocation-real
```
