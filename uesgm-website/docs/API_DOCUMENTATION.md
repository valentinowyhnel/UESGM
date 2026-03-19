# UESGM API Documentation

## Authentication
Authentication is handled via NextAuth.js.
- **Roles**: `SUPER_ADMIN`, `ADMIN`, `MODERATOR`, `MEMBER`, `PUBLIC`.
- **Protected Routes**: All `/api/admin/*` and administrative methods (POST, PUT, DELETE) for public resources require a valid session with appropriate roles.

## Endpoints

### 1. Contact Form
- **POST** `/api/contact`
- **Public access**
- **Rate Limit**: 5 requests / 15 min per IP.
- **Body**: `{ name: string, email: string, subject?: string, message: string }`
- **Response**: `{ success: true, id: string, message: "Votre message a été envoyé avec succès." }`

### 2. Events
- **GET** `/api/events?page=1&per=10&status=upcoming|past&category=...`
- **Public access** (Only published events).
- **POST** `/api/events` (Admin+)
- **PUT** `/api/events` (Admin+)
- **DELETE** `/api/events?id=...` (Admin+)

### 3. Projects
- **GET** `/api/projects?page=1&per=10&status=...&category=...`
- **Public access** (Only published projects).
- **POST** `/api/projects` (Admin+)
- **PUT** `/api/projects` (Admin+)
- **DELETE** `/api/projects?id=...` (Admin+)

### 4. Documents
- **GET** `/api/documents?page=1&per=10&category=...&search=...`
- **Public access** (Only published documents with visibility=PUBLIC).
- **POST** `/api/documents` (Admin+)
- **PUT** `/api/documents` (Admin+)
- **DELETE** `/api/documents?id=...` (Admin+)

### 5. Partners
- **GET** `/api/partners?page=1&per=10&type=INSTITUTIONAL|PRIVATE`
- **Public access**
- **POST** `/api/partners` (Admin+)
- **PUT** `/api/partners` (Admin+)
- **DELETE** `/api/partners?id=...` (Admin+)

### 6. Search (Global)
- **GET** `/api/search?query=...&type=all|events|projects|documents|partners`
- **Public access**
- **Description**: Returns top 5 results across specified categories using PostgreSQL full-text search.

### 7. Statistics
- **GET** `/api/statistics`
- **Public access** (General metrics).
- **Admin access** (Detailed metrics, user counts, and recent logs).

### 8. Upload
- **POST** `/api/upload`
- **Requires Auth** (Admin+).
- **Description**: Generates signed URLs for Supabase Storage/S3.
- **Body**: `{ type: "image"|"document", category?: string }`
- **Response**: `{ success: true, data: { fileId: string, url: string, ... } }`

## Middleware & Security
- **HSTS**: 1 year.
- **CSP**: Strict content security policy.
- **Permissions-Policy**: Restricted camera, mic, and location.
- **Rate Limiting**: Redis-backed via Upstash or LRU-Cache.
- **CORS**: Domain whitelist configured for production.
