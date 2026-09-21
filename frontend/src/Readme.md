# DocVault

A full-stack private document management platform — Django REST Framework backend with a React + TypeScript frontend.

---

## Project Structure

```
docvault/
├── backend/                    # Django project
│   ├── apps/
│   │   ├── accounts/           # Auth — register, login, JWT
│   │   ├── activity/           # Audit log of all user actions
│   │   ├── common/             # Shared exception handler
│   │   ├── files/              # File upload, download, preview, trash, star
│   │   ├── folders/            # Folder CRUD
│   │   ├── sharing/            # File sharing between users
│   │   └── storage/            # (Reserved — empty URL router)
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py         # Shared settings
│   │   │   ├── development.py  # SQLite + DEBUG=True
│   │   │   └── production.py   # PostgreSQL + security headers
│   │   ├── celery.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   ├── manage.py
│   ├── .env                    # Environment variables (copy from .env.example)
│   └── requirements.txt
└── frontend/                   # React + TypeScript (Vite)
    └── src/
        ├── pages/
        │   ├── Activity.tsx
        │   ├── Dashboard.tsx
        │   ├── Files.tsx
        │   ├── Folders.tsx
        │   ├── Login.tsx
        │   ├── Recent.tsx
        │   ├── Register.tsx
        │   ├── Sharing.tsx
        │   ├── Starred.tsx
        │   └── Trash.tsx
        ├── services/
        │   └── api.ts          # Axios instance with JWT refresh interceptor
        ├── App.tsx
        ├── main.tsx
        └── styles.css
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | Django 5.2, Django REST Framework 3.18 |
| Auth | JWT via `djangorestframework-simplejwt` (access 15 min / refresh 7 days, rotation + blacklist) |
| Database (dev) | SQLite |
| Database (prod) | PostgreSQL via `psycopg2-binary` |
| File storage | Django `FileField` → `media/documents/YYYY/MM/` |
| Task queue | Celery + Redis (wired, no tasks defined yet) |
| API schema | `drf-spectacular` (Swagger at `/api/docs/`, Redoc at `/api/redoc/`) |
| Static files | WhiteNoise |
| Frontend | React 19, TypeScript, Vite |
| Routing | React Router v7 |
| HTTP client | Axios with silent JWT token-refresh interceptor |
| Animation | Framer Motion |
| Icons | Lucide React |

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- (Production) PostgreSQL 14+
- (Optional) Redis for Celery task queue

---

## Backend Setup

### 1. Create and activate a virtual environment

```bash
cd backend
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

Copy `.env` and fill in your values:

```bash
cp .env .env.local   # edit .env.local, or edit .env directly
```

Key variables:

```env
DJANGO_SECRET_KEY=<long-random-string>
DEBUG=True

# Development uses SQLite — DB_* vars are only used in production
DB_NAME=docvault
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173

REDIS_URL=redis://localhost:6379/0
MAX_UPLOAD_SIZE_MB=50

JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
JWT_SECRET_KEY=<separate-jwt-secret>
```

> **Note:** Development uses SQLite (`db.sqlite3` in `backend/`). No PostgreSQL required to run locally.

### 4. Run migrations

```bash
python manage.py migrate
```

### 5. (Optional) Create a superuser

```bash
python manage.py createsuperuser
```

### 6. Start the development server

```bash
python manage.py runserver
```

The API is available at `http://localhost:8000/api/`.

---

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

The app opens at `http://localhost:5173`.

---

## API Endpoints

### Auth — `/api/auth/`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Create account |
| POST | `/api/auth/login/` | Login → returns `access` + `refresh` tokens |
| POST | `/api/auth/refresh/` | Refresh access token |

### Files — `/api/files/`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/files/` | List user's active files |
| POST | `/api/files/` | Upload file (multipart) |
| GET | `/api/files/{id}/` | Get file details |
| DELETE | `/api/files/{id}/` | Soft-delete (move to trash) |
| GET | `/api/files/{id}/download/` | Download file (blob) |
| GET | `/api/files/{id}/preview/` | Preview file inline (blob) |
| PATCH | `/api/files/{id}/rename/` | Rename file |
| PATCH | `/api/files/{id}/move/` | Move file to a different folder |
| PATCH | `/api/files/{id}/star/` | Toggle starred status |
| GET | `/api/files/starred/` | List starred files |
| GET | `/api/files/recent/` | Files recently previewed or downloaded |
| GET | `/api/files/trash/` | List soft-deleted files |
| POST | `/api/files/{id}/restore/` | Restore file from trash |
| DELETE | `/api/files/{id}/permanent-delete/` | Permanently delete file + storage |

**Upload constraints** (enforced in `FileUploadSerializer`):
- Max size: `MAX_UPLOAD_SIZE_MB` (default 50 MB)
- Allowed extensions: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.docx`, `.xlsx`, `.txt`

### Folders — `/api/folders/`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/folders/` | List user's folders |
| POST | `/api/folders/` | Create folder |
| GET | `/api/folders/{id}/` | Get folder |
| PUT/PATCH | `/api/folders/{id}/` | Update folder |
| DELETE | `/api/folders/{id}/` | Delete folder |

Folders are unique by `(owner, parent, name)`.

### Sharing — `/api/sharing/`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sharing/files/{file_id}/` | Share a file with a user by email |
| GET | `/api/sharing/my-shares/` | Files you have shared (active shares only) |
| GET | `/api/sharing/shared-with-me/` | Files shared with you (non-expired) |
| DELETE | `/api/sharing/{id}/revoke/` | Revoke a share (sets `revoked_at`) |

Shares support optional `expires_at`. Access check in `FileDownloadView` / `FilePreviewView` respects expiry and revocation.

### Activity — `/api/activity/`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/activity/` | Last 100 activity log entries for the user |

Logged actions: `login`, `upload`, `preview`, `download`, `share`, `revoke_share`, `rename`, `move`, `trash`, `restore`, `permanent_delete`, `create_folder`, `delete_folder`, `star`, `unstar`.

### Schema

| Endpoint | Description |
|---|---|
| `/api/schema/` | Raw OpenAPI schema |
| `/api/docs/` | Swagger UI |
| `/api/redoc/` | Redoc UI |

---

## Data Models

### `accounts.User`
Extends `AbstractUser`. Adds `email` as a unique field.

### `files.File`
| Field | Type | Notes |
|---|---|---|
| `owner` | FK → User | Cascade on delete |
| `folder` | FK → Folder | Nullable, SET_NULL |
| `name` | CharField(255) | Display name |
| `file` | FileField | Stored at `documents/YYYY/MM/` |
| `size` | PositiveBigIntegerField | Bytes |
| `mime_type` | CharField | Set on upload |
| `visibility` | CharField | `private` / `shared` |
| `is_starred` | BooleanField | Default False |
| `is_deleted` | BooleanField | Soft-delete flag |
| `deleted_at` | DateTimeField | Nullable |

### `folders.Folder`
| Field | Type | Notes |
|---|---|---|
| `owner` | FK → User | |
| `name` | CharField(255) | |
| `parent` | FK → self | Nullable, supports nesting |

Unique constraint: `(owner, parent, name)`.

### `sharing.FileShare`
| Field | Type | Notes |
|---|---|---|
| `file` | FK → File | |
| `shared_with` | FK → User | |
| `expires_at` | DateTimeField | Nullable |
| `revoked_at` | DateTimeField | Nullable; set on revoke |

Unique constraint: `(file, shared_with)` where `revoked_at IS NULL`.

### `activity.ActivityLog`
| Field | Type | Notes |
|---|---|---|
| `user` | FK → User | |
| `action` | CharField | TextChoices |
| `file` | FK → File | Nullable |
| `folder` | FK → Folder | Nullable |
| `target_user` | FK → User | Nullable |
| `description` | CharField(500) | Human-readable |
| `ip_address` | GenericIPAddressField | From `X-Forwarded-For` or `REMOTE_ADDR` |

---

## Frontend Pages

| Route | Page | Description |
|---|---|---|
| `/` | Landing | Marketing landing with vault preview |
| `/login` | Login | Username + password → JWT tokens stored in `localStorage` |
| `/register` | Register | Create account |
| `/dashboard` | Dashboard | Stats (file count, storage, private/shared), recent files |
| `/files` | Files | Full file list with upload, search, folder filter, rename, move, share, star, delete |
| `/folders` | Folders | Folder grid with create/delete |
| `/sharing` | Sharing | Tabs: Shared with me / My shares; revoke from My shares |
| `/activity` | Activity | Timeline of all logged actions, grouped by day, searchable |
| `/recent` | Recent | Files previewed/downloaded recently |
| `/starred` | Starred | Starred files with unstar action |
| `/trash` | Trash | Soft-deleted files; restore or permanently delete |
| `/settings` | Settings | Placeholder (not yet implemented) |

### JWT Refresh Flow (`src/services/api.ts`)
The Axios instance automatically retries any 401 response by refreshing the token. Concurrent requests are queued and replayed after the refresh succeeds. On refresh failure, tokens are cleared and the user is redirected to `/login`.

---

## Authentication Flow

1. `POST /api/auth/register/` → creates user
2. `POST /api/auth/login/` → returns `{ access, refresh }`; frontend stores both in `localStorage`
3. All subsequent requests include `Authorization: Bearer <access>`
4. On 401, the interceptor calls `POST /api/auth/refresh/` and retries
5. Logout clears both tokens and navigates to `/login`

---

## Error Handling

All API errors are normalised through `apps.common.exceptions.custom_exception_handler`:

```json
{ "error": "<message>", "status_code": 400 }
```

Field-level validation errors (e.g. from serializers) are preserved as-is under `"error"`.

---

## Production Checklist

- [ ] Set `DEBUG=False` and use `config.settings.production`
- [ ] Set a strong `DJANGO_SECRET_KEY`
- [ ] Configure PostgreSQL credentials in `.env`
- [ ] Set `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` to your real domains
- [ ] Run `python manage.py collectstatic`
- [ ] Start gunicorn: `gunicorn config.wsgi:application`
- [ ] Set up Redis and run Celery worker: `celery -A config worker -l info`
- [ ] Configure a reverse proxy (nginx) to serve `/media/` and `/static/`
- [ ] Use HTTPS (production settings enforce HSTS and secure cookies)

---

## Development Commands

```bash
# Backend
python manage.py runserver          # Start dev server
python manage.py migrate            # Apply migrations
python manage.py makemigrations     # Create migrations after model changes
python manage.py createsuperuser    # Create admin user
python manage.py spectacular --file schema.yml  # Export OpenAPI schema

# Frontend
npm run dev     # Start Vite dev server
npm run build   # Production build (output: dist/)
npm run preview # Preview production build locally
```

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `DJANGO_SECRET_KEY` | — | Required. Django secret key |
| `DEBUG` | `False` | Set to `True` for development |
| `DB_NAME` | — | PostgreSQL database name (production) |
| `DB_USER` | — | PostgreSQL user (production) |
| `DB_PASSWORD` | — | PostgreSQL password (production) |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `ALLOWED_HOSTS` | — | Comma-separated list of allowed hostnames |
| `CORS_ALLOWED_ORIGINS` | — | Comma-separated list of allowed frontend origins |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis URL for Celery |
| `MAX_UPLOAD_SIZE_MB` | `50` | Maximum file upload size in MB |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | `15` | Access token lifetime |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | `7` | Refresh token lifetime |
| `JWT_SECRET_KEY` | — | Optional separate signing key for JWT |