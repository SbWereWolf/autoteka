# backup/

Сюда складываются **артефакты бэкапа** конфигов с сервера (без изменения рабочих мест в `/etc/...`).

Рекомендуемая структура:

```text
backup/
  etc/
    docker/daemon.json
    systemd/journald.conf.d/limits.conf
    fail2ban/jail.d/sshd.local
    systemd/system/docker.service.d/override.conf
    vue-app/deploy.env
    vue-app/telegram.env
    systemd/system/vue-app.service
    systemd/system/vue-app-deploy.*
    systemd/system/server-watchdog.*
    systemd/system/server-maintenance.*
    logrotate.d/vue-app-deploy
    logrotate.d/server-watchdog
```

⚠️ Секреты:

- `backup/etc/` лучше держать в `.gitignore` (или хранить только шаблоны без секретов).
