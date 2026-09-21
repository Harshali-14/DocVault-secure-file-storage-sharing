# DocVault Architecture

React/Vite frontend communicates with Django REST Framework over HTTPS in production. PostgreSQL stores metadata and relationships. Redis/Celery handle asynchronous work. Development uses local media storage; production should use S3-compatible object storage.

Security principles:
- Server-side authorization
- Object-level access checks
- Unpredictable storage keys
- Validated uploads
- Expiring/revocable sharing
- Secrets only in environment variables
