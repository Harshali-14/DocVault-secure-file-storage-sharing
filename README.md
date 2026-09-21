# DocVault
Secure Document & File Management Platform.

## Stack
- Django 5.2 + Django REST Framework
- PostgreSQL
- JWT authentication
- React + Vite + TypeScript
- Framer Motion
- Axios
- Celery + Redis
- OpenAPI / Swagger

## Current status
Starter project with Django/DRF backend foundation and React frontend foundation. Authentication, file security, sharing, audit logging, Celery tasks, and production deployment are implemented incrementally.

## Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py check
python manage.py runserver
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```

Create `backend/.env` from `.env.example` and configure PostgreSQL.
