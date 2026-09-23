# DocVault

> **Your files. Your control.**

DocVault is a secure private document management platform built with **Django REST Framework** and **React + TypeScript**.

It provides a centralized workspace for uploading, organizing, previewing, downloading, sharing, and managing personal documents while keeping files private by default.

The project focuses on secure file management, controlled sharing, authentication, activity tracking, folder organization, and a modern responsive user experience.

---

## Overview

DocVault allows users to manage their documents through a secure web application.

Users can:

- Create an account and securely authenticate
- Upload and manage documents
- Organize files into folders
- Search and filter files
- Preview supported documents
- Download files
- Rename and move files
- Star important files
- Track recently accessed files
- Move files to trash
- Restore deleted files
- Permanently delete files
- Share files with other registered users
- Revoke shared access
- Set optional share expiry
- View account activity
- Monitor storage usage

Files are private by default and access is controlled through authenticated API requests.

---

# Features

## Authentication

- User registration
- JWT-based login
- Access and refresh tokens
- Automatic access-token refresh
- Token rotation and blacklist support
- Protected API endpoints
- Automatic redirect after authentication

---

## File Management

- Upload documents
- File size validation
- File extension validation
- MIME type validation
- Filename sanitization
- Duplicate filename prevention
- File preview
- File download
- File rename
- File move
- File deletion
- Permanent deletion
- File metadata
- Star/unstar files

Duplicate filenames are prevented within the same folder for the same user.

For example:

```text
resume.pdf
````

cannot be uploaded twice into the same location.

The same filename can exist in different folders.

---

## Folder Management

* Create folders
* Delete folders
* Rename/update folders
* Nested folder support
* Move files between folders
* Folder ownership validation

Folders are unique according to:

```text
(owner, parent, name)
```

---

## Search & Organization

* Search files
* Filter by folder
* Star important files
* Recent files
* Trash management
* Folder-based organization
* List view
* Grid view

---

## Sharing

Users can securely share files with other registered users.

Supported functionality:

* Share a file by email
* View files shared with you
* View files you have shared
* Revoke access
* Optional share expiration
* Access validation for expired shares
* Access validation for revoked shares

Shared access is controlled by the backend rather than relying only on frontend restrictions.

---

## Activity Tracking

DocVault maintains an activity history for important user actions.

Tracked actions include:

```text
login
upload
preview
download
share
revoke_share
rename
move
trash
restore
permanent_delete
create_folder
delete_folder
star
unstar
```

The activity page provides a searchable timeline of user actions.

---

## Trash & Recovery

Deleted files are first moved to trash instead of being immediately removed.

Users can:

* View deleted files
* Restore files
* Permanently delete files

This provides an additional recovery layer before permanent deletion.

---

# Security

Security is a core part of DocVault.

The application implements:

* JWT authentication
* Protected API endpoints
* Owner-based access control
* Private-by-default files
* Folder ownership validation
* Share permission validation
* Share expiration
* Share revocation
* Filename sanitization
* File extension validation
* MIME type validation
* Upload size restrictions
* Duplicate filename protection
* Soft deletion
* Permanent deletion
* Environment-based configuration
* Production security settings

The backend is responsible for validating permissions rather than trusting the frontend.

---

# Supported File Types

DocVault currently supports:

| Extension | MIME Type                                                                 |
| --------- | ------------------------------------------------------------------------- |
| `.pdf`    | `application/pdf`                                                         |
| `.jpg`    | `image/jpeg`                                                              |
| `.jpeg`   | `image/jpeg`                                                              |
| `.png`    | `image/png`                                                               |
| `.webp`   | `image/webp`                                                              |
| `.docx`   | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `.xlsx`   | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`       |
| `.txt`    | `text/plain`                                                              |

Maximum upload size is configurable through:

```env
MAX_UPLOAD_SIZE_MB=50
```

---

# Tech Stack

## Frontend

| Technology    | Purpose                        |
| ------------- | ------------------------------ |
| React         | UI                             |
| TypeScript    | Type-safe frontend development |
| Vite          | Frontend build tool            |
| React Router  | Client-side routing            |
| Axios         | API communication              |
| Framer Motion | UI animations                  |
| Lucide React  | Icons                          |

---

## Backend

| Technology            | Purpose                        |
| --------------------- | ------------------------------ |
| Django                | Backend framework              |
| Django REST Framework | REST API                       |
| Simple JWT            | JWT authentication             |
| SQLite                | Development database           |
| PostgreSQL            | Production database            |
| Celery                | Background task infrastructure |
| Redis                 | Task queue infrastructure      |
| drf-spectacular       | OpenAPI / API documentation    |
| WhiteNoise            | Static file serving            |

---

# Architecture

DocVault follows a separated frontend/backend architecture.

```text
                    ┌──────────────────────┐
                    │      React App       │
                    │   TypeScript + Vite  │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               │ JWT
                               ▼
                    ┌──────────────────────┐
                    │   Django REST API    │
                    │       Backend        │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        ┌──────────┐     ┌──────────┐     ┌──────────┐
        │ Database │     │   Media  │     │  Redis   │
        │ SQLite / │     │  Files   │     │ + Celery │
        │PostgreSQL│     │          │     │          │
        └──────────┘     └──────────┘     └──────────┘
```

---

# Project Structure

```text
docvault/
│
├── backend/
│   │
│   ├── apps/
│   │   │
│   │   ├── accounts/
│   │   │   └── Authentication and user management
│   │   │
│   │   ├── activity/
│   │   │   └── User activity and audit logs
│   │   │
│   │   ├── common/
│   │   │   └── Shared utilities and exception handling
│   │   │
│   │   ├── files/
│   │   │   └── File upload, download, preview, trash and star
│   │   │
│   │   ├── folders/
│   │   │   └── Folder management
│   │   │
│   │   ├── sharing/
│   │   │   └── File sharing and access control
│   │   │
│   │   └── storage/
│   │       └── Storage-related infrastructure
│   │
│   ├── config/
│   │   │
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   │
│   │   ├── celery.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   │
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   │
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Activity.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Files.tsx
│   │   │   ├── Folders.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Recent.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Sharing.tsx
│   │   │   ├── Starred.tsx
│   │   │   └── Trash.tsx
│   │   │
│   │   ├── services/
│   │   │   └── api.ts
│   │   │
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   │
│   └── package.json
│
├── docs/
│   └── screenshots/
│
└── README.md
```

---

# Prerequisites

Before running DocVault locally, install:

* Python 3.11+
* Node.js 18+
* npm
* Git

For production:

* PostgreSQL 14+
* Redis
* Gunicorn
* Reverse proxy such as Nginx

PostgreSQL and Redis are **not required for basic local development**.

---

# Local Setup

## 1. Clone the repository

```bash
git clone https://github.com/Harshali-14/DocVault.git
cd DocVault
```

---

# Backend Setup

## 2. Navigate to backend

```bash
cd backend
```

---

## 3. Create a virtual environment

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 4. Install dependencies

```bash
pip install -r requirements.txt
```

---

## 5. Configure environment variables

Create a `.env` file from `.env.example`.

```bash
copy .env.example .env
```

For macOS/Linux:

```bash
cp .env.example .env
```

Example development configuration:

```env
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True

ALLOWED_HOSTS=localhost,127.0.0.1

CORS_ALLOWED_ORIGINS=http://localhost:5173

MAX_UPLOAD_SIZE_MB=50

JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

JWT_SECRET_KEY=your-jwt-secret-key

REDIS_URL=redis://localhost:6379/0
```

Development uses SQLite, so PostgreSQL configuration is not required for local development.

---

## 6. Run migrations

```bash
python manage.py migrate
```

---

## 7. Create a superuser

Optional:

```bash
python manage.py createsuperuser
```

---

## 8. Start the backend

```bash
python manage.py runserver
```

Backend:

```text
http://localhost:8000/
```

API:

```text
http://localhost:8000/api/
```

---

# Frontend Setup

Open a second terminal.

## 9. Navigate to frontend

From the project root:

```bash
cd frontend
```

---

## 10. Install dependencies

```bash
npm install
```

---

## 11. Start the development server

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173/
```

---

# API Documentation

DocVault provides automatically generated OpenAPI documentation.

### Swagger UI

```text
http://localhost:8000/api/docs/
```

### ReDoc

```text
http://localhost:8000/api/redoc/
```

### OpenAPI Schema

```text
http://localhost:8000/api/schema/
```

---

# API Endpoints

## Authentication

Base URL:

```text
/api/auth/
```

| Method | Endpoint     | Description                  |
| ------ | ------------ | ---------------------------- |
| POST   | `/register/` | Create a new account         |
| POST   | `/login/`    | Login and receive JWT tokens |
| POST   | `/refresh/`  | Refresh access token         |

---

## Files

Base URL:

```text
/api/files/
```

| Method | Endpoint                  | Description                  |
| ------ | ------------------------- | ---------------------------- |
| GET    | `/`                       | List active files            |
| POST   | `/`                       | Upload a file                |
| GET    | `/{id}/`                  | Get file details             |
| DELETE | `/{id}/`                  | Move file to trash           |
| GET    | `/{id}/download/`         | Download file                |
| GET    | `/{id}/preview/`          | Preview file                 |
| PATCH  | `/{id}/rename/`           | Rename file                  |
| PATCH  | `/{id}/move/`             | Move file                    |
| PATCH  | `/{id}/star/`             | Toggle starred status        |
| GET    | `/starred/`               | List starred files           |
| GET    | `/recent/`                | List recently accessed files |
| GET    | `/trash/`                 | List deleted files           |
| POST   | `/{id}/restore/`          | Restore deleted file         |
| DELETE | `/{id}/permanent-delete/` | Permanently delete file      |

---

## Folders

Base URL:

```text
/api/folders/
```

| Method | Endpoint | Description             |
| ------ | -------- | ----------------------- |
| GET    | `/`      | List folders            |
| POST   | `/`      | Create folder           |
| GET    | `/{id}/` | Get folder              |
| PUT    | `/{id}/` | Update folder           |
| PATCH  | `/{id}/` | Partially update folder |
| DELETE | `/{id}/` | Delete folder           |

---

## Sharing

Base URL:

```text
/api/sharing/
```

| Method | Endpoint            | Description                  |
| ------ | ------------------- | ---------------------------- |
| POST   | `/files/{file_id}/` | Share file with another user |
| GET    | `/my-shares/`       | View files shared by you     |
| GET    | `/shared-with-me/`  | View files shared with you   |
| DELETE | `/{id}/revoke/`     | Revoke shared access         |

Shares may optionally have an expiration time.

---

## Activity

Base URL:

```text
/api/activity/
```

| Method | Endpoint | Description              |
| ------ | -------- | ------------------------ |
| GET    | `/`      | Retrieve recent activity |

---

# Authentication Flow

DocVault uses JWT-based authentication.

```text
Register
   │
   ▼
POST /api/auth/register/
   │
   ▼
Login
   │
   ▼
POST /api/auth/login/
   │
   ├───────────────┐
   ▼               ▼
Access Token    Refresh Token
   │
   ▼
Authenticated API Requests
   │
   ▼
401 Response
   │
   ▼
Refresh Access Token
   │
   ▼
Retry Original Request
```

The frontend Axios client automatically handles token refresh.

When multiple requests receive a `401` response simultaneously, refresh requests are coordinated so that requests can be queued and replayed after a successful token refresh.

If refresh fails:

```text
Tokens cleared
      ↓
User redirected to /login
```

---

# Data Models

## User

The custom user model extends Django's `AbstractUser` and provides a unique email field.

---

## File

Important fields include:

| Field        | Description           |
| ------------ | --------------------- |
| `owner`      | File owner            |
| `folder`     | Associated folder     |
| `name`       | User-visible filename |
| `file`       | Stored file           |
| `size`       | File size in bytes    |
| `mime_type`  | MIME type             |
| `visibility` | Private/shared        |
| `is_starred` | Star status           |
| `is_deleted` | Trash status          |
| `deleted_at` | Deletion timestamp    |

Files are stored using Django's `FileField`.

Storage path:

```text
media/documents/YYYY/MM/
```

---

## Folder

Folders support nesting through a self-referencing parent relationship.

```text
Folder
 ├── owner
 ├── name
 └── parent
```

Folder names are unique per owner and parent folder.

---

## FileShare

Controls file sharing between users.

Important fields:

```text
file
shared_with
expires_at
revoked_at
```

Access is denied when a share is revoked or expired.

---

## ActivityLog

Records important user actions.

Examples:

```text
upload
download
preview
rename
move
share
revoke_share
trash
restore
permanent_delete
star
unstar
```

---

# Frontend Routes

| Route        | Page      | Purpose                  |
| ------------ | --------- | ------------------------ |
| `/`          | Landing   | Product landing page     |
| `/login`     | Login     | User authentication      |
| `/register`  | Register  | Account creation         |
| `/dashboard` | Dashboard | Overview and statistics  |
| `/files`     | Files     | Complete file management |
| `/folders`   | Folders   | Folder management        |
| `/sharing`   | Sharing   | Shared files             |
| `/activity`  | Activity  | Activity history         |
| `/recent`    | Recent    | Recently accessed files  |
| `/starred`   | Starred   | Starred files            |
| `/trash`     | Trash     | Deleted files            |
| `/settings`  | Settings  | Settings area            |

---

# File Validation

Uploaded files go through multiple validation layers.

### 1. File size

The configured maximum upload size is enforced.

```env
MAX_UPLOAD_SIZE_MB=50
```

### 2. Extension

Only supported extensions are accepted.

### 3. MIME type

The uploaded MIME type is checked against the allowed MIME types.

### 4. Filename sanitization

Unsafe filesystem characters are sanitized.

### 5. Duplicate detection

The backend prevents duplicate active filenames for the same user in the same folder.

Example:

```text
Documents/
├── resume.pdf
└── resume.pdf   ← blocked
```

But:

```text
Documents/
└── resume.pdf

Projects/
└── resume.pdf   ← allowed
```

---

# Error Handling

API errors are normalized through the shared exception handler.

Example:

```json
{
  "error": "File validation failed.",
  "status_code": 400
}
```

Serializer validation errors retain field-specific information where applicable.

For example:

```json
{
  "error": {
    "name": [
      "A file named \"resume.pdf\" already exists in this location."
    ]
  },
  "status_code": 400
}
```

---

# Production Configuration

The backend includes separate development and production settings.

```text
backend/config/settings/

├── base.py
├── development.py
└── production.py
```

Development uses:

```text
SQLite
DEBUG=True
```

Production is configured for:

```text
PostgreSQL
DEBUG=False
WhiteNoise
Security headers
HTTPS
HSTS
```

---

# Production Checklist

Before deploying DocVault:

* [ ] Set `DEBUG=False`
* [ ] Generate a strong Django secret key
* [ ] Configure PostgreSQL
* [ ] Configure production `ALLOWED_HOSTS`
* [ ] Configure production CORS origins
* [ ] Configure media storage
* [ ] Run migrations
* [ ] Run `collectstatic`
* [ ] Configure Gunicorn
* [ ] Configure HTTPS
* [ ] Configure reverse proxy
* [ ] Configure Redis
* [ ] Start Celery worker
* [ ] Configure backups
* [ ] Keep `.env` out of version control

---

# Useful Commands

## Backend

Start server:

```bash
python manage.py runserver
```

Create migrations:

```bash
python manage.py makemigrations
```

Apply migrations:

```bash
python manage.py migrate
```

Create admin user:

```bash
python manage.py createsuperuser
```

Export OpenAPI schema:

```bash
python manage.py spectacular --file schema.yml
```

Collect static files:

```bash
python manage.py collectstatic
```

---

## Frontend

Start development server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

# Screenshots

Screenshots can be added under:

```text
docs/screenshots/
```

Recommended screenshots:

```text
docs/
└── screenshots/
    ├── landing.png
    ├── login.png
    ├── dashboard.png
    ├── files.png
    ├── folders.png
    ├── sharing.png
    ├── activity.png
    ├── trash.png
    └── mobile.png
```

Then include them here:

```md
## Screenshots

### Landing Page

![DocVault Landing Page](docs/screenshots/landing.png)

### Dashboard

![DocVault Dashboard](docs/screenshots/dashboard.png)

### File Management

![DocVault Files](docs/screenshots/files.png)

### Responsive Design

![DocVault Mobile](docs/screenshots/mobile.png)
```

---

# Development Status

DocVault currently includes:

* [x] User registration
* [x] JWT authentication
* [x] Token refresh
* [x] File upload
* [x] File validation
* [x] Duplicate filename protection
* [x] File preview
* [x] File download
* [x] File rename
* [x] File move
* [x] Folder management
* [x] Search and filtering
* [x] List view
* [x] Grid view
* [x] Starred files
* [x] Recent files
* [x] Trash
* [x] File restoration
* [x] Permanent deletion
* [x] File sharing
* [x] Share revocation
* [x] Share expiration
* [x] Activity tracking
* [x] Responsive interface
* [x] Swagger API documentation

---

# Future Improvements

Potential future improvements include:

* [ ] Advanced storage analytics
* [ ] Additional file formats
* [ ] Bulk file operations
* [ ] Bulk download
* [ ] Advanced sharing controls
* [ ] Background file processing
* [ ] Cloud object storage integration
* [ ] Automated backups
* [ ] Email notifications
* [ ] Two-factor authentication
* [ ] Password reset flow
* [ ] More granular permissions
* [ ] Production deployment

---

# Why DocVault?

DocVault was built to explore the practical challenges involved in developing a secure full-stack file management system.

The project combines:

* REST API development
* Authentication and authorization
* File handling
* Database relationships
* Access control
* Secure sharing
* Frontend state management
* API integration
* Responsive UI development
* Activity auditing
* Production-oriented configuration

It is designed as a practical full-stack application rather than a simple CRUD project.

---

# License

This project is currently intended as a personal portfolio and learning project.

---

# Author

**Harshali Kulkarni**

Software Engineer | Python & Django Developer

* GitHub: [https://github.com/Harshali-14](https://github.com/Harshali-14)
* LinkedIn: [https://linkedin.com/in/harshali-kulkarni-54a822236](https://linkedin.com/in/harshali-kulkarni-54a822236)
* Portfolio: [https://harshali.pythonanywhere.com/](https://harshali.pythonanywhere.com/)

---

# Project

**DocVault**

> Secure private document management — built with Django REST Framework and React + TypeScript.





