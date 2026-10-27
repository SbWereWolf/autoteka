# Сброс бизнес-данных и восстановление SQLite

Руководство для технического администратора локальной установки Ubuntu
WSL. Команда принадлежит `backend/apps/ShopOperator`.

## 1. Условия выполнения

- Зависимости PHP установлены; интерпретатор задан в `scripts/.env`
  через `SCRIPT_PHP_PATH`. Доступны PDO SQLite, SQLite с `VACUUM INTO` и
  CLI `sqlite3`.
- Оба приложения подключены к нужной SQLite БД. В текущей установке это
  `backend/database/database.sqlite`; команда выводит фактический путь.
- Применены миграции действующей схемы из раздела 5. Внешние ключи
  включены, ссылочная целостность соблюдена.
- Перед изменением данных остановлены API, ShopOperator и другие
  писатели этой БД. Локальные `artisan serve` останавливаются `Ctrl+C` в
  их терминалах.
- Исходный файл доступен для чтения и записи. Каталог резервных копий
  существует и доступен для записи; путь новой копии абсолютный и
  уникальный, расширение — `.sqlite`.

Из корня репозитория проверьте и загрузите подготовленные настройки:

```bash
pwsh scripts/swap-env.ps1 validate -t scripts-env -t shop-operator-env
source scripts/.env
```

## 2. Состав очистки

По умолчанию очищаются магазины, категории, фишки, связи магазинов с
категориями и фишками, контакты, расписания, галереи магазинов, акции и
их изображения/видео. Таблицы:

- `promotion_gallery_video`, `promotion_gallery_image`, `promotion`;
- `shop_gallery_video`, `shop_gallery_image`, `shop_schedule`,
  `shop_contact`;
- `shop_feature`, `shop_category`, `shop`, `category`, `feature`;
- legacy-таблица `promotion_image`, если она присутствует в этой
  установке.

Города и типы контактов сохраняются. Для дополнительной очистки `city`
используется только явный ключ `--purge-cities`; для `contact_type` —
только `--purge-contact-types`. Ключи независимы и могут применяться
вместе. `shop_contact` очищается при любом сочетании ключей, поэтому
сохранённые типы остаются без контактов удалённых магазинов.

При любом сочетании ключей сохраняются `users`, `password_reset_tokens`,
`moonshine_users`, `moonshine_user_roles`, `sessions`, `notifications`,
`cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`,
`migrations` и `sqlite_sequence`. Учётные записи, роли и счётчики ID
сохраняют значения. Медиафайлы и файлы инфраструктуры остаются на месте.

Удаление каждой бизнес-таблицы явно задано в команде. Сначала удаляются
зависимые записи, затем родители. Все удаления входят в одну транзакцию;
действующая схема использует ограничивающие внешние ключи без
`ON DELETE CASCADE`.

## 3. Выполнение сброса

После остановки писателей выполните из корня репозитория:

```bash
source scripts/.env
mkdir -p "$AUTOTEKA_ROOT/backend/database/backup"
RESET_BACKUP_PATH="$AUTOTEKA_ROOT/backend/database/backup/$(date +%Y%m%d-%H%M%S).database.sqlite"
cd "$AUTOTEKA_ROOT/backend/apps/ShopOperator"
"$SCRIPT_PHP_PATH" artisan autoteka:business:reset --backup="$RESET_BACKUP_PATH"
```

Для очистки вместе с городами используйте **вместо последнего вызова**:

```bash
"$SCRIPT_PHP_PATH" artisan autoteka:business:reset \
  --backup="$RESET_BACKUP_PATH" \
  --purge-cities
```

Для очистки типов контактов используйте вместо последнего вызова:

```bash
"$SCRIPT_PHP_PATH" artisan autoteka:business:reset \
  --backup="$RESET_BACKUP_PATH" \
  --purge-contact-types
```

Для очистки обоих справочников в одном запуске:

```bash
"$SCRIPT_PHP_PATH" artisan autoteka:business:reset \
  --backup="$RESET_BACKUP_PATH" \
  --purge-cities \
  --purge-contact-types
```

Выберите один из четырёх вариантов для одного нового пути backup.
Сообщения об успехе отдельно показывают результат для типов контактов.

Команда создаёт самостоятельную согласованную SQLite-копию через
`VACUUM INTO`, включая зафиксированные данные из WAL, проверяет её
целостность и сообщает путь. После этого проверяет внешние ключи и
выполняет явное удаление. Ошибка резервирования прекращает выполнение до
удаления; ошибка удаления откатывает всю транзакцию.

Для повторного запуска сформируйте новый уникальный путь копии. Команда
также создаёт копию при повторном сбросе уже пустого каталога. После
успешного сброса запустите приложения по
[руководству администратора](ADMIN_MANUAL.md#51-локальный-запуск-в-ubuntu-wsl).
Вход существующего оператора сохраняется, каталог можно наполнять
заново.

После `--purge-cities` начните заполнение с городов. После
`--purge-contact-types` создайте типы контактов перед контактами
магазинов. Затем наполняйте остальные справочники и каталог.

| Код | Значение                                                                |
| --- | ----------------------------------------------------------------------- |
| 0   | Резервирование и очистка выполнены                                      |
| 1   | Ошибка операции или ссылочной целостности; успешная очистка не заявлена |
| 2   | Неверный путь --backup или существующий файл                            |
| 3   | Целевая БД недоступна либо не соответствует необходимым условиям SQLite |

## 4. Восстановление

Остановите писателей. Используйте `RESET_BACKUP_PATH`, сохранённый при
вызове команды, либо задайте в нём абсолютный путь нужной созданной
копии. Восстановление возвращает **всю БД**, включая схему и служебные
данные, к моменту резервирования.

```bash
: "${AUTOTEKA_ROOT:?Загрузите scripts/.env из корня репозитория}"
: "${RESET_BACKUP_PATH:?Укажите абсолютный путь резервной копии}"
(
  set -e
  SQLITE_BACKUP_PATH=${RESET_BACKUP_PATH//\\/\\\\}
  SQLITE_BACKUP_PATH=${SQLITE_BACKUP_PATH//\"/\\\"}
  sqlite3 -readonly "$RESET_BACKUP_PATH" 'PRAGMA quick_check;'
  sqlite3 "$AUTOTEKA_ROOT/backend/database/database.sqlite" ".restore \"$SQLITE_BACKUP_PATH\""
  sqlite3 -readonly "$AUTOTEKA_ROOT/backend/database/database.sqlite" \
    'PRAGMA quick_check; PRAGMA foreign_key_check;'
)
```

Ожидаются `ok` для проверки целостности и отсутствие строк нарушений FK.
После проверки запустите приложения и войдите существующей учётной
записью.

## 5. Переход к схеме без каскадного удаления

Миграция `2026_10_28_030000_restrict_delete_rules.php` заменяет 10
канонических связей на `RESTRICT`, сохраняя остальные правила FK,
строки, ID, индексы и счётчики. Она подключена обычным провайдером
`SchemaDefinition`. Сохранённые исторические миграции остаются
неизменными.

В текущей legacy-установке дополнительно применяется
`2026_10_28_030100_restrict_legacy_promotion_image_delete.php` из
отдельного каталога `database/legacy-migrations`. Этот путь предназначен
для известной установки с `promotion_image`; чистая каноническая схема
его не использует.

Перед переходом выполните цикл на отдельной резервированной копии по
[правилам тестирования](TESTING.md#10-проверки-сброса-бизнес-данных).
После успешной проверки остановите писателей и выполните из корня
репозитория для текущей legacy-установки:

```bash
(
  set -e
  source scripts/.env
  mkdir -p "$AUTOTEKA_ROOT/backend/database/backup"
  MIGRATION_BACKUP_PATH="$AUTOTEKA_ROOT/backend/database/backup/$(date +%Y%m%d-%H%M%S).database.sqlite"
  SQLITE_BACKUP_PATH=${MIGRATION_BACKUP_PATH//\\/\\\\}
  SQLITE_BACKUP_PATH=${SQLITE_BACKUP_PATH//\"/\\\"}
  sqlite3 -readonly "$AUTOTEKA_ROOT/backend/database/database.sqlite" ".backup \"$SQLITE_BACKUP_PATH\""
  cd "$AUTOTEKA_ROOT/backend/apps/ShopOperator"
  "$SCRIPT_PHP_PATH" artisan migrate --force --realpath \
    --path="$AUTOTEKA_ROOT/backend/packages/SchemaDefinition/database/migrations/2026_10_28_030000_restrict_delete_rules.php" \
    --path="$AUTOTEKA_ROOT/backend/packages/SchemaDefinition/database/legacy-migrations/2026_10_28_030100_restrict_legacy_promotion_image_delete.php"
)
```

Миграции выполняются штатным журналируемым переходом. Каждый новый файл
применяется один раз и выполняет собственный атомарный переход. При
исключении его изменения откатываются и проверка FK восстанавливается.
Полный откат пары проверяется с обоими явными путями.

После перехода проверьте `quick_check`, `foreign_key_check`, отсутствие
каскадных правил и сохранность исходных данных. Затем запустите API и
ShopOperator и проверьте каталог и вход оператора.

```sql
SELECT m.name, f."from", f."table", f.on_delete
FROM sqlite_schema AS m
JOIN pragma_foreign_key_list(m.name) AS f
WHERE m.type = 'table' AND f.on_delete = 'CASCADE';
```

Ожидаемый результат последнего запроса — пустой набор.
