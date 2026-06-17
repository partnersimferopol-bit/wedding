# Подробная инструкция: заявки с сайта → админка + ВК + Telegram

Игра: [partnersimferopol-bit.github.io/wedding](https://partnersimferopol-bit.github.io/wedding/)  
Сообщество: [vk.com/3d_les](https://vk.com/3d_les)  
Беседа для заявок: `https://vk.com/im/convo/-202321163`

После настройки при каждой заявке:
1. данные сохраняются на сервере (Cloudflare);
2. в беседу ВК приходит сообщение от сообщества;
3. в **Telegram** приходит то же уведомление (если настроен бот);
4. в **admin.html** видны все заявки (не только с одного компьютера).

---

## Что понадобится

| № | Что | Зачем |
|---|-----|--------|
| 1 | Компьютер с Windows | Терминал PowerShell |
| 2 | Аккаунт [Cloudflare](https://www.cloudflare.com) | Бесплатный сервер для заявок (**обязательно**) |
| 2а | [Node.js](https://nodejs.org) (LTS) | **Только** если настраиваете через терминал (способ А) |
| 4 | Админка сообщества ВК 3d_les | Ключ API |
| 5 | Беседа в сообществе | Куда падут уведомления ВК |
| 5а | Telegram-бот | Уведомления в Telegram (**рекомендуется**) |
| 6 | Доступ к GitHub (репозиторий wedding) | Обновить сайт |

**Время:** примерно 30–40 минут с нуля.

### Node.js — это не «регистрация на nodejs.org»

На [nodejs.org](https://nodejs.org) **не нужно регистрироваться**. Это сайт, откуда **скачивают программу** (как архиватор или браузер). Аккаунт там не создаётся.

Node.js нужен **только** для команд в терминале (`npm`, `wrangler`).  
**Подключить ВК без Node.js можно** — через сайт Cloudflare (способ Б ниже).

| | Способ А — терминал | Способ Б — только браузер |
|--|---------------------|---------------------------|
| Node.js | Нужен | **Не нужен** |
| Аккаунт Cloudflare | Нужен | Нужен |
| Ключ ВК + беседа | Нужны | Нужны |
| Сложность | Средняя | Проще, если терминал пугает |

Оба способа делают одно и то же: сервер принимает заявки и шлёт их в ВК и Telegram.

---

## Безопасность (прочитайте первым делом)

1. **Ключ API ВК** и **токен Telegram-бота** — как пароли. Никому не отправляйте в чат, не публикуйте на GitHub.
2. Если ключ уже светился где-то — **удалите** его в ВК / у @BotFather и создайте **новый**.
3. В GitHub кладём только **URL** сервера (`baseUrl`), без токенов.
4. Пароль админки (`ADMIN_SECRET`) — вводите в **admin.html** на своём ПК или храните у себя, не в открытом репозитории.

---

# ЧАСТЬ 1. Подготовка ВКонтакте

## Шаг 1.1. Беседа для заявок

1. Откройте [vk.com/3d_les](https://vk.com/3d_les).
2. **Сообщения** → убедитесь, что есть беседа для заявок (у вас: [беседа -202321163](https://vk.com/im/convo/-202321163)).
3. Добавьте в беседу всех, кто должен видеть заявки (вы, менеджеры).

## Шаг 1.2. Ключ доступа API

1. Сообщество → **Управление** (под аватаркой).
2. **Работа с API** → **Создать ключ**.
3. Отметьте права:
   - **Сообщения сообщества** — обязательно;
   - при необходимости **Управление сообществом**.
4. Нажмите **Создать**.
5. Скопируйте ключ в блокнот **на своём компьютере** (длинная строка букв и цифр).

> Это `VK_GROUP_TOKEN`. Понадобится на шаге 3.3 — ввод в терминал.

## Шаг 1.3. Число для беседы (`VK_NOTIFY_PEER_ID`)

Из ссылки `convo/-202321163` берём число **202321163** (без минуса).

Для API ВК обычно:

```text
VK_NOTIFY_PEER_ID = 2000000000 + 202321163 = 2202321163
```

Запишите: **2202321163**

Если позже отправка не сработает — см. раздел «Проблемы» в конце.

## Шаг 1.4. Пароль для админки

Придумайте длинный пароль, например: `MoyaIgra3dLes2026!Secret`

Это `ADMIN_SECRET` — для просмотра списка заявок в admin.html.

Запишите у себя. **Не** публикуйте в интернете.

---

# ЧАСТЬ 1б. Telegram (уведомления в мессенджер)

Можно настроить **параллельно с ВК** или **только Telegram** (ВК тогда необязателен).

## Шаг 1б.1. Создать бота

1. Откройте Telegram → найдите **@BotFather**.
2. Отправьте команду `/newbot`.
3. Придумайте имя бота (например: `3D Les Заявки`).
4. Придумайте username латиницей (например: `dles_3d_leads_bot`) — должен заканчиваться на `bot`.
5. BotFather пришлёт **токен** вида `7123456789:AAH...` — скопируйте в блокнот.

Это `TELEGRAM_BOT_TOKEN`.

## Шаг 1б.2. Куда слать заявки (`TELEGRAM_CHAT_ID`)

**Вариант А — личные сообщения вам (проще всего)**

1. Найдите своего бота в Telegram по username.
2. Нажмите **Запустить** / отправьте `/start`.
3. Откройте в браузере (подставьте **свой** токен):

```text
https://api.telegram.org/botВАШ_ТОКЕН/getUpdates
```

4. В ответе найдите `"chat":{"id":123456789` — это число и есть `TELEGRAM_CHAT_ID` (положительное).

**Вариант Б — группа менеджеров**

1. Создайте группу в Telegram (например «Заявки 3Д-лес»).
2. Добавьте в группу вашего бота (через поиск по username).
3. Напишите в группе любое сообщение (например «тест»).
4. Снова откройте `getUpdates` — найдите `"chat":{"id":-1001234567890` (отрицательное число).
5. Это `TELEGRAM_CHAT_ID`.

> Если `getUpdates` пустой — сначала напишите боту `/start` или сообщение в группе, затем обновите страницу.

Запишите: **TELEGRAM_CHAT_ID** = ваше число (с минусом, если группа).

---

# СПОСОБ Б. Без Node.js — только браузер (Cloudflare)

Если не хотите ставить Node.js и работать в терминале — делайте так.

## Б.1. Регистрация Cloudflare

1. Откройте [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up).
2. Зарегистрируйтесь (email + пароль). Это **единственная** регистрация, которая здесь нужна.
3. Подтвердите почту.

## Б.2. Создать Worker

1. В панели Cloudflare: **Workers & Pages** → **Create**.
2. **Create Worker** → имя, например `gift-future-leads` → **Deploy**.
3. Откройте вкладку **Edit code**.
4. Удалите весь код в редакторе.
5. Скопируйте **целиком** файл из проекта: `worker\src\index.js` → вставьте в редактор.
6. **Save and deploy**.

## Б.3. Хранилище заявок (KV)

1. Слева **Workers & Pages** → **KV**.
2. **Create a namespace** → имя `LEADS` → Create.
3. Вернитесь в ваш Worker → **Settings** → **Bindings** → **Add** → **KV namespace**.
4. Variable name: `LEADS` (точно так, заглавными).
5. Namespace: выберите созданный `LEADS` → **Save**.

## Б.4. Секреты (ВК, Telegram, админка)

Worker → **Настройки** / **Settings** → **Переменные и секреты** / **Variables and Secrets** → **Добавить** / **Add**:

| Тип | Имя | Значение |
|-----|-----|----------|
| Secret | `VK_GROUP_TOKEN` | ключ API сообщества ВК (если нужен ВК) |
| Secret | `VK_NOTIFY_PEER_ID` | `2202321163` |
| Secret | `TELEGRAM_BOT_TOKEN` | токен от @BotFather |
| Secret | `TELEGRAM_CHAT_ID` | id чата (например `123456789` или `-1001234567890`) |
| Secret | `ADMIN_SECRET` | ваш пароль для админки |

**Сохранить** / **Save**. Если Worker уже был задеплоен — обновите код из `worker\src\index.js` (шаг Б.2) и снова **Сохранить и развернуть**.

## Б.5. Адрес сервера

Worker → **Settings** → вверху домен вида:

`https://gift-future-leads.ВАШ_ЛОГИН.workers.dev`

Скопируйте его.

Проверка в браузере: откройте `https://ВАШ_URL/health` — должно быть:

```json
{"ok":true,"vk":true,"telegram":true}
```

`vk` или `telegram` могут быть `false`, если соответствующий канал не настроен — это нормально, пока не добавите секреты.

## Б.6. Дальше — как в частях 4–6

1. Прописать URL в `js\config-leads.js` → `git push` (или попросить кого-то с Git).
2. **admin.html** → Заявки → URL + пароль.
3. Тестовая заявка на сайте → сообщение в [беседе ВК](https://vk.com/im/convo/-202321163) и/или в Telegram.

**Node.js для способа Б не нужен.**

---

# СПОСОБ А. Через терминал (нужен Node.js)

# ЧАСТЬ 2. Установка программ на компьютер

## Шаг 2.1. Node.js

1. Скачайте LTS с [nodejs.org](https://nodejs.org).
2. Установите (галочки по умолчанию).
3. Откройте **PowerShell** и проверьте:

```powershell
node -v
npm -v
```

Должны показаться версии (например `v20.x`, `10.x`).

## Шаг 2.2. Wrangler (инструмент Cloudflare)

В PowerShell:

```powershell
npm install -g wrangler
wrangler -v
```

Должна появиться версия wrangler.

---

# ЧАСТЬ 3. Настройка сервера заявок (Cloudflare Worker)

## Шаг 3.1. Открыть папку проекта

```powershell
cd "f:\МОЯ ЗАГРУЗКИ\курсор\igra\worker"
```

(Если проект лежит в другом месте — укажите свой путь.)

## Шаг 3.2. Войти в Cloudflare

```powershell
wrangler login
```

- Откроется браузер.
- Войдите или зарегистрируйтесь на [cloudflare.com](https://www.cloudflare.com) (бесплатно).
- Разрешите доступ Wrangler.
- В терминале появится сообщение об успешном входе.

## Шаг 3.3. Автоматическая настройка (рекомендуется)

```powershell
.\setup-leads.ps1
```

Скрипт спросит по очереди:

| Запрос | Что ввести |
|--------|------------|
| `VK_GROUP_TOKEN` | **Новый** ключ из шага 1.2 (вставить, Enter) |
| `VK_NOTIFY_PEER_ID` | `2202321163` |
| `TELEGRAM_BOT_TOKEN` | токен из шага 1б.1 |
| `TELEGRAM_CHAT_ID` | id из шага 1б.2 |
| `ADMIN_SECRET` | Пароль из шага 1.4 |

Дальше скрипт сам:
- создаст хранилище заявок (KV);
- задеплоит сервер;
- проверит `/health`;
- запишет URL в `js\config-leads.js`.

**Запишите URL** вида: `https://gift-future-leads.ВАШ_ЛОГИН.workers.dev`

---

### Шаг 3.3 (альтернатива). Вручную, если скрипт не запустился

```powershell
# Создать хранилище
wrangler kv namespace create LEADS
```

В выводе будет строка `id = "abc123..."`. Откройте файл `worker\wrangler.toml` и замените:

```toml
id = "PASTE_KV_NAMESPACE_ID_AFTER_CREATE"
```

на ваш `id`.

Секреты (каждая команда — ввод значения с клавиатуры):

```powershell
wrangler secret put VK_GROUP_TOKEN
wrangler secret put VK_NOTIFY_PEER_ID
wrangler secret put ADMIN_SECRET
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
```

Деплой:

```powershell
wrangler deploy
```

В конце будет URL Worker — скопируйте его.

Пропишите URL в `js\config-leads.js`:

```javascript
const LEADS_API = {
  baseUrl: 'https://ВАШ_URL.workers.dev',
  adminSecret: '',
};
```

(`adminSecret` оставьте пустым — пароль только в админке.)

---

## Шаг 3.4. Проверка сервера

В PowerShell (подставьте свой URL):

```powershell
Invoke-RestMethod "https://ВАШ_URL.workers.dev/health"
```

Ожидаемый ответ:

```json
{
  "ok": true,
  "vk": true
}
```

- `ok: true` — сервер работает.
- `vk: true` — токен и peer_id заданы.

Если `vk: false` — секреты ВК не заданы, повторите `wrangler secret put`.

---

# ЧАСТЬ 4. Обновить сайт на GitHub

Чтобы игра на GitHub Pages знала адрес сервера.

## Шаг 4.1. Проверить config-leads.js

Файл `js\config-leads.js` должен содержать ваш URL:

```javascript
const LEADS_API = {
  baseUrl: 'https://gift-future-leads.XXXX.workers.dev',
  adminSecret: '',
};
```

## Шаг 4.2. Залить на GitHub

```powershell
cd "f:\МОЯ ЗАГРУЗКИ\курсор\igra"
git add js/config-leads.js
git commit -m "Подключить API заявок"
git push origin main
```

Подождите 1–2 минуты, пока обновится [сайт](https://partnersimferopol-bit.github.io/wedding/).

---

# ЧАСТЬ 5. Настройка админки

## Шаг 5.1. Открыть admin.html

Локально: `f:\МОЯ ЗАГРУЗКИ\курсор\igra\admin.html`  
Или на сайте: `https://partnersimferopol-bit.github.io/wedding/admin.html`

## Шаг 5.2. Вкладка «Заявки»

Заполните:

| Поле | Значение |
|------|----------|
| URL API | `https://ВАШ_URL.workers.dev` (без слэша в конце) |
| Ключ админки | тот же `ADMIN_SECRET`, что вводили в wrangler |

Нажмите **«Сохранить настройки API»**.

Нажмите **«Обновить список»** — пока заявок может не быть, это нормально.

---

# ЧАСТЬ 6. Тестовая заявка

## Шаг 6.1. Пройти игру

1. Откройте [сайт](https://partnersimferopol-bit.github.io/wedding/) (**Ctrl+F5**).
2. Пройдите до конца.
3. На результате **выберите** вариант из «Идеи от 3Д-лес» (нажмите на строку).
4. Заполните форму: имя, Telegram/MAX.
5. **Отправить мастеру в 3Д-лес**.

## Шаг 6.2. Что должно произойти

| Где | Результат |
|-----|-----------|
| Сайт | «Спасибо! Заявка сохранена: «…»» |
| [Беседа ВК](https://vk.com/im/convo/-202321163) | Сообщение от сообщества |
| Telegram (бот / группа) | То же сообщение с полями заявки |
| admin.html → Заявки | Новая строка в списке |

## Шаг 6.3. Если в ВК ничего нет

1. Нажмите **F12** в браузере → вкладка **Сеть** (Network).
2. Найдите запрос `lead` — посмотрите ответ.
3. Поля `vk.error` и `telegram.error` подскажут причину (см. таблицы ниже).

---

# ЧАСТЬ 7. Как это работает (схема)

```text
Пользователь на сайте
        │
        ▼
  POST /lead  ──►  Cloudflare Worker
        │              │
        │              ├──► KV (все заявки)
        │              ├──► VK API messages.send → беседа 3d_les
        │              └──► Telegram Bot API → чат/группа
        │
        ▼
  «Спасибо!»

Админка  GET /leads  ──►  Worker  ──►  список заявок
         (с паролем)
```

---

# Проблемы и решения

## Cloudflare / терминал

| Проблема | Решение |
|----------|---------|
| `wrangler` не найден | `npm install -g wrangler`, перезапустите PowerShell |
| Ошибка при `setup-leads.ps1` | Выполните шаг 3.3 вручную |
| `health` → `vk: false` | Повторите секреты `VK_GROUP_TOKEN` и `VK_NOTIFY_PEER_ID` |
| `health` → `telegram: false` | Добавьте `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` |

## ВКонтакте

| Ошибка в `vk.error` | Решение |
|---------------------|---------|
| Access denied | В ключе нет права «Сообщения сообщества» — создайте новый ключ |
| Can't send messages to this peer | Неверный peer_id. Попробуйте `202321163` или узнайте через [messages.getConversations](https://dev.vk.com/ru/method/messages.getConversations) |
| 901 | Используйте беседу админов, а не личные сообщения |

### Как узнать правильный peer_id

В браузере (подставьте **свой** ключ — только у себя, не публикуйте):

```text
https://api.vk.com/method/messages.getConversations?access_token=ВАШ_КЛЮЧ&v=5.199&count=20
```

В ответе найдите вашу беседу → `conversation.peer.id` → это и есть `VK_NOTIFY_PEER_ID`.

Обновить:

```powershell
wrangler secret put VK_NOTIFY_PEER_ID
wrangler deploy
```

## Telegram

| Ошибка в `telegram.error` | Решение |
|---------------------------|---------|
| `chat not found` | Неверный `TELEGRAM_CHAT_ID`. Проверьте через `getUpdates` |
| `Unauthorized` | Неверный `TELEGRAM_BOT_TOKEN` — создайте новый у @BotFather |
| `bot was blocked by the user` | Напишите боту `/start` в личке |
| `have no rights to send a message` | Добавьте бота в группу и дайте право писать (или сделайте админом) |
| `telegram: skipped` | Секреты не заданы — добавьте в Cloudflare → Settings → Secrets |

Обновить секреты:

```powershell
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
wrangler deploy
```

## Сайт / админка

| Проблема | Решение |
|----------|---------|
| Заявка только в одном браузере | Не настроен `baseUrl` в config-leads.js или не сделан `git push` |
| Админка: Unauthorized | Неверный `ADMIN_SECRET` в admin.html |
| CORS / failed to fetch | Проверьте URL Worker, откройте `/health` |

---

# Краткая шпаргалка (команды)

```powershell
# Один раз
npm install -g wrangler
cd "f:\МОЯ ЗАГРУЗКИ\курсор\igra\worker"
.\setup-leads.ps1

# Обновить сайт
cd "f:\МОЯ ЗАГРУЗКИ\курсор\igra"
git add js/config-leads.js
git commit -m "API заявок"
git push origin main

# Проверка
Invoke-RestMethod "https://ВАШ_URL.workers.dev/health"
```

**В админке:** URL + ADMIN_SECRET → Сохранить → Обновить список.

**Тест:** заявка на сайте → сообщение в [беседе ВК](https://vk.com/im/convo/-202321163).

---

# Файлы в проекте

| Файл | Назначение |
|------|------------|
| `worker/src/index.js` | Логика API и отправка в ВК |
| `worker/wrangler.toml` | Настройки Worker |
| `worker/setup-leads.ps1` | Автонастройка из терминала |
| `js/config-leads.js` | URL сервера для игры |
| `js/app.js` | Отправка заявки при submit |
| `admin.html` | Просмотр заявок |
| `DEPLOY-VK.md` | Краткая техническая справка |

---

Если застрянете на конкретном шаге — напишите **номер шага** и **текст ошибки из терминала** (без ключей и паролей).
