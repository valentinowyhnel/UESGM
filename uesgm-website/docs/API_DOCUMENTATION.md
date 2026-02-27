# UESGM API Documentation

Welcome to the UESGM (Union des Étudiants et Stagiaires Gabonais au Maroc) API documentation.

## Base URL
The API is available at `/api`.

## Authentication
Admin routes require authentication via NextAuth. Roles supported:
- `SUPER_ADMIN`
- `ADMIN`
- `MODERATOR`
- `MEMBER`
- `PUBLIC`

## Endpoints

### 1. Contact
- **POST `/api/contact`**
  - Description: Send a contact message.
  - Public access.
  - Rate limited (5 requests per 15 minutes).

### 2. Events
- **GET `/api/events`**
  - Description: List published events.
  - Query Params: `page`, `per`, `category`, `status` (upcoming/past/all).
- **POST `/api/events`**
  - Description: Create a new event.
  - Requires `ADMIN`, `SUPER_ADMIN`, or `MODERATOR`.
- **PUT `/api/events`**
  - Description: Update an event.
  - Requires `ADMIN`, `SUPER_ADMIN`, or `MODERATOR`.
- **DELETE `/api/events?id=...`**
  - Description: Delete an event.
  - Requires `ADMIN`, `SUPER_ADMIN`, or `MODERATOR`.

### 3. Projects
- **GET `/api/projects`**
  - Description: List published projects.
- **POST/PUT/DELETE `/api/projects`**
  - Admin access required.

### 4. Documents
- **GET `/api/documents/list`**
  - Description: List available documents.
- **POST `/api/admin/documents/[id]/new-version`**
  - Description: Add a new version of a document.

### 5. Search
- **GET `/api/search?query=...`**
  - Description: Global search across all entities.

### 6. Upload
- **POST `/api/upload`**
  - Description: Generate a signed URL for file upload.
- **PUT `/api/upload`**
  - Description: Confirm upload and finalize document creation.

### 7. Statistics
- **GET `/api/statistics`**
  - Description: Public and admin (detailed) statistics.

## Security
- Rate limiting is enforced via Middleware and local logic.
- CSP and HSTS headers are active.
- RBAC is enforced for all admin endpoints.
