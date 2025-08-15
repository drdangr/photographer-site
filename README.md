# Сайт профессионального фотографа

Коротко: Next.js‑приложение с публичным сайтом, админ‑панелью и клиентским порталом. Поддерживает богатое редактирование контента (TipTap), загрузку изображений в Supabase Storage с иерархией путей и дедупликацией, безопасное удаление медиа, сортировки и разделы.

— Публичная часть: «Об авторе», галереи, услуги, обучение, лекции/статьи, новости.
— Админ‑панель: CRUD для всех разделов, сортировки, редактор, очистка сиротских медиа.
— Клиентский портал: личные галереи клиентов, загрузки клиента и фотографа, управление медиа.

## Структура проекта и модули
```
app/
  (public)/               # Публичные страницы (about, services, education, galleries, news)
    galleries/[slug]/     # Страница галереи
  admin/                  # Админ‑панель
    author/               # Профиль автора (био, контакты)
    galleries/            # Галереи: список, новая, редактирование
    education/, services/ # Разделы услуг/обучения
    lectures/             # Лекции/статьи, разделы, сортировка
    news/                 # Новости (CRUD)
    login, logout         # Авторизация в админке
  api/                    # Внутренние API (auth, upload, storage, admin‑утилиты)
  clients/                # Клиентский портал: вход/регистрация, галереи, редактирование

components/
  RichEditor.tsx          # TipTap‑редактор: заголовки, списки, таблицы, code, ссылки, изображения
  ImageInput.tsx          # Загрузка одного изображения (URL/файл), читает prefix
  CoverImageInput.tsx     # Загрузка обложек
  MultiImageInput.tsx     # Пакетная загрузка изображений (URL/файлы)
  SaveButton.tsx          # Единая кнопка «Сохранить» (pending + dirty)

lib/
  prisma.ts               # Подключение Prisma
  session.ts              # Серверные сессии (iron‑session)
  supabase.ts             # Клиент Supabase (браузер)
  supabaseServer.ts       # Клиент Supabase (server, service role)
  slug.ts                 # Нормализация slug

prisma/
  schema.prisma           # Схема БД (User, AuthorProfile, Gallery, Photo, Lecture, NewsItem и пр.)
  migrations/             # Миграции
  seed.js                 # Сидинг данных (опционально)

public/
  uploads/                # Dev‑загрузки без Supabase (локально)
```

Ключевые модули
- Редактор: `components/RichEditor.tsx` — TipTap + расширения: StarterKit, Underline, Link, TextAlign, Image, Placeholder, Table (+Row/Header/Cell). Картинки с `loading="lazy"`.
- Загрузка медиа: `ImageInput`, `CoverImageInput`, `MultiImageInput` → `/api/upload` или signed‑upload. Принимает `prefix` для иерархии.
- Админ‑утилиты: `/api/admin/cleanup-orphan-media` (очистка Storage от неиспользуемых файлов), `/api/admin/migrate-client-media-sizes`.
- Клиентский портал: отдельные префиксы хранения и безопасное удаление при удалении фото/галереи.

## Стек технологий и зависимости
### Стек
- Next.js (App Router, Server Components/Actions)
- React 18, TypeScript
- Prisma (Postgres)
- Supabase: Auth, Storage
- TipTap редактор + расширения
- Tailwind CSS (+ `@tailwindcss/typography`)
- iron‑session (сессии), bcryptjs (хеши паролей)

### Основные зависимости (runtime)
- `next`, `react`, `react-dom`
- `@supabase/supabase-js`
- `@tiptap/*` (starter-kit, react, image, underline, link, text-align, table, table-row, table-header, table-cell, placeholder)
- `lowlight` (подсветка для code‑block при необходимости)
- `react-markdown` (рендер markdown в публичных частях, при необходимости)
- `tailwindcss`, `postcss`, `autoprefixer`
- `@prisma/client`
- `iron-session`, `bcryptjs`

### Dev‑зависимости
- `prisma`, `typescript`
- `@types/node`, `@types/react`, `@types/react-dom`
- `@tailwindcss/typography`

## Загрузка и хранение медиа
- Все загрузки идут в Supabase Storage, бакет `public-images`.
- Иерархия путей:
  - Лекции: `lectures/YYYY/MM/DD/<slug>/{pictures|covers}`
  - Галереи: `galleries/YYYY/MM/DD/<slug>/{pictures|covers}`
  - Новости: `news/YYYY/MM/DD/HHmm/{pictures|cover}`
  - «Об авторе»: `about/YYYY/MM/DD`
  - Клиентский портал:
    - клиент: `clients/YYYY/MM/DD/gallery-<id>/client/pictures`
    - фотограф: `clients/YYYY/MM/DD/gallery-<id>/master/pictures`

Встроены: lazy‑loading для картинок из редактора, дедупликация (`MediaAsset`), «безопасное удаление» (файл удаляется из Storage только если URL больше нигде не встречается в БД), ручная очистка сирот.

## Быстрый старт (локально)
1) `npm install`
2) `npx prisma generate`
3) `npx prisma migrate dev --name init`
4) (опц.) `npm run seed`
5) `npm run dev` → `http://localhost:3000`

## Доступы
- Админ‑панель: `/admin` (логин/пароль — из сидера либо задайте в БД)
- Клиентский портал: `/clients` (регистрация/подтверждение через Supabase Auth)

## Переменные окружения
Создайте `.env` (или настройте переменные в Vercel):
```
DATABASE_URL=...
DIRECT_URL=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_BUCKET=public-images
IRON_SESSION_PASSWORD=<min 32 символа>
```

На Vercel сохраните те же значения в Project Settings → Environment Variables.


