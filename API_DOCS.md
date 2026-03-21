# API Documentation

Complete endpoint reference for the Anime Review API.

This project is a basic RESTful API that covers core CRUD operations for anime and reviews, plus authentication and role-based authorization.

## Base URL

Development: `http://localhost:3000`    
Production: Configure based on deployment environment

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained through login or registration endpoints. They contain user ID, role, and email.

## Response Format

All responses are JSON formatted.

### Success Response
```json
{
  "data": {},
  "message": "Description"
}
```

### Error Response
```json
{
  "error": "Error description"
}
```

## Status Codes

- `200` - Successful GET, PUT, DELETE request
- `201` - Successful POST request (resource created)
- `400` - Bad request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `409` - Conflict (duplicate record)
- `500` - Internal server error

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Authentication:** Not required

**Request Body:**
```json
{
  "username": "string (3-30 chars, alphanumeric and underscore only)",
  "email": "string (valid email format)",
  "password": "string (8-72 chars)"
}
```

**Request Example:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "USER",
    "createdAt": "2026-03-21T10:30:00Z",
    "updatedAt": "2026-03-21T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Invalid input format or requirements not met
- `409` - Username or email already in use

**Validation Rules:**
- Username: 3-30 characters, letters, numbers, underscores only
- Email: Valid email format
- Password: 8-72 characters minimum

---

### Login User

Authenticate with email and password to obtain JWT token.

**Endpoint:** `POST /api/auth/login`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "string (valid email format)",
  "password": "string"
}
```

**Request Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "USER",
    "createdAt": "2026-03-21T10:30:00Z",
    "updatedAt": "2026-03-21T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Invalid input format
- `401` - Invalid email or password

---

## Anime Endpoints

### List All Anime

Retrieve list of all anime in the catalog with optional filtering.

**Endpoint:** `GET /api/animes`

**Authentication:** Not required

**Query Parameters:**
- `genre` (optional) - Filter by genre (case insensitive contains match)
- `releaseYear` (optional) - Filter by release year (exact match)

**Request Example:**
```bash
curl "http://localhost:3000/api/animes?genre=action&releaseYear=2024"
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "title": "Attack on Titan",
    "synopsis": "Humanity fights for survival against giant creatures",
    "genre": "action",
    "releaseYear": 2013,
    "createdAt": "2026-03-21T10:30:00Z",
    "_count": {
      "reviews": 5
    }
  },
  {
    "id": 2,
    "title": "Death Note",
    "synopsis": "A student finds a notebook that can kill anyone",
    "genre": "supernatural",
    "releaseYear": 2006,
    "createdAt": "2026-03-21T10:32:00Z",
    "_count": {
      "reviews": 3
    }
  }
]
```

**Error Responses:**
- `500` - Server error

---

### Create Anime

Add a new anime to the catalog.

**Endpoint:** `POST /api/animes`

**Authentication:** Not required (no restrictions, public endpoint)

**Request Body:**
```json
{
  "title": "string (required)",
  "synopsis": "string (required)",
  "genre": "string (required)",
  "releaseYear": "integer (1900-2100, required)"
}
```

**Request Example:**
```bash
curl -X POST http://localhost:3000/api/animes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Demon Slayer",
    "synopsis": "A young warrior fights against demons to save his sister",
    "genre": "action",
    "releaseYear": 2019
  }'
```

**Success Response (201):**
```json
{
  "id": 3,
  "title": "Demon Slayer",
  "synopsis": "A young warrior fights against demons to save his sister",
  "genre": "action",
  "releaseYear": 2019,
  "createdAt": "2026-03-21T10:35:00Z"
}
```

**Error Responses:**
- `400` - Missing required fields or invalid year format
- `500` - Server error

---

### Get Anime Details

Retrieve detailed information about a specific anime including all reviews.

**Endpoint:** `GET /api/animes/:id`

**Authentication:** Not required

**Path Parameters:**
- `id` - Anime ID (integer)

**Request Example:**
```bash
curl http://localhost:3000/api/animes/1
```

**Success Response (200):**
```json
{
  "id": 1,
  "title": "Attack on Titan",
  "synopsis": "Humanity fights for survival against giant creatures",
  "genre": "action",
  "releaseYear": 2013,
  "createdAt": "2026-03-21T10:30:00Z",
  "reviews": [
    {
      "id": 5,
      "rating": 9,
      "comment": "Amazing series",
      "createdAt": "2026-03-21T11:00:00Z",
      "updatedAt": "2026-03-21T11:00:00Z",
      "userId": 1,
      "animeId": 1,
      "user": {
        "id": 1,
        "username": "john_doe"
      }
    }
  ]
}
```

**Error Responses:**
- `400` - Invalid anime ID format
- `404` - Anime not found
- `500` - Server error

---

### Update Anime

Modify anime information (all fields are optional).

**Endpoint:** `PUT /api/animes/:id`

**Authentication:** Not required

**Path Parameters:**
- `id` - Anime ID (integer)

**Request Body:**
```json
{
  "title": "string (optional)",
  "synopsis": "string (optional)",
  "genre": "string (optional)",
  "releaseYear": "integer (1900-2100, optional)"
}
```

**Request Example:**
```bash
curl -X PUT http://localhost:3000/api/animes/1 \
  -H "Content-Type: application/json" \
  -d '{
    "genre": "action,fantasy",
    "releaseYear": 2013
  }'
```

**Success Response (200):**
```json
{
  "id": 1,
  "title": "Attack on Titan",
  "synopsis": "Humanity fights for survival against giant creatures",
  "genre": "action,fantasy",
  "releaseYear": 2013,
  "createdAt": "2026-03-21T10:30:00Z"
}
```

**Error Responses:**
- `400` - Invalid anime ID format or invalid year
- `404` - Anime not found
- `500` - Server error

---

### Delete Anime

Remove an anime from the catalog.

**Endpoint:** `DELETE /api/animes/:id`

**Authentication:** Not required

**Path Parameters:**
- `id` - Anime ID (integer)

**Request Example:**
```bash
curl -X DELETE http://localhost:3000/api/animes/1
```

**Success Response (200):**
```json
{
  "message": "Anime deleted successfully"
}
```

**Error Responses:**
- `400` - Invalid anime ID format
- `404` - Anime not found
- `500` - Server error

---

## Review Endpoints

### List All Reviews

Retrieve all reviews in the system (admin only).

**Endpoint:** `GET /api/reviews`

**Authentication:** Required (admin only)

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10, max: 100) - Results per page

**Request Example:**
```bash
curl "http://localhost:3000/api/reviews?page=1&limit=10" \
  -H "Authorization: Bearer your-jwt-token"
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "rating": 9,
      "comment": "Excellent anime series",
      "createdAt": "2026-03-21T11:00:00Z",
      "updatedAt": "2026-03-21T11:00:00Z",
      "userId": 1,
      "animeId": 1,
      "user": {
        "id": 1,
        "username": "john_doe"
      },
      "anime": {
        "id": 1,
        "title": "Attack on Titan"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Error Responses:**
- `400` - Invalid pagination parameters
- `401` - Missing or invalid token
- `403` - User is not admin
- `500` - Server error

---

### Get Anime Reviews

Retrieve all reviews for a specific anime with pagination.

**Endpoint:** `GET /api/animes/:id/reviews`

**Authentication:** Not required

**Path Parameters:**
- `id` - Anime ID (integer)

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10, max: 100) - Results per page

**Request Example:**
```bash
curl "http://localhost:3000/api/animes/1/reviews?page=1&limit=5"
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "rating": 9,
      "comment": "Best anime ever",
      "createdAt": "2026-03-21T11:00:00Z",
      "updatedAt": "2026-03-21T11:00:00Z",
      "userId": 1,
      "animeId": 1,
      "user": {
        "id": 1,
        "username": "john_doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 5,
    "totalPages": 1
  }
}
```

**Error Responses:**
- `400` - Invalid anime ID or pagination parameters
- `404` - Anime not found
- `500` - Server error

---

### Create Review

Add a review for an anime (one review per user per anime).

**Endpoint:** `POST /api/animes/:id/reviews`

**Authentication:** Required

**Path Parameters:**
- `id` - Anime ID (integer)

**Request Body:**
```json
{
  "rating": "integer (1-10, required)",
  "comment": "string (required, non-empty)"
}
```

**Request Example:**
```bash
curl -X POST http://localhost:3000/api/animes/1/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "rating": 9,
    "comment": "This anime is absolutely amazing and worth watching"
  }'
```

**Success Response (201):**
```json
{
  "id": 1,
  "rating": 9,
  "comment": "This anime is absolutely amazing and worth watching",
  "createdAt": "2026-03-21T11:00:00Z",
  "updatedAt": "2026-03-21T11:00:00Z",
  "userId": 1,
  "animeId": 1,
  "user": {
    "id": 1,
    "username": "john_doe"
  }
}
```

**Error Responses:**
- `400` - Invalid anime ID, rating format, or missing comment
- `401` - Missing or invalid token
- `404` - Anime not found
- `409` - User already has a review for this anime
- `500` - Server error

**Validation Rules:**
- Rating: Integer between 1 and 10 inclusive
- Comment: Non-empty string (trimmed)

---

### Get Review Details

Retrieve a specific review by ID.

**Endpoint:** `GET /api/reviews/:id`

**Authentication:** Not required

**Path Parameters:**
- `id` - Review ID (integer)

**Request Example:**
```bash
curl http://localhost:3000/api/reviews/1
```

**Success Response (200):**
```json
{
  "id": 1,
  "rating": 9,
  "comment": "This anime is absolutely amazing and worth watching",
  "createdAt": "2026-03-21T11:00:00Z",
  "updatedAt": "2026-03-21T11:00:00Z",
  "userId": 1,
  "animeId": 1,
  "user": {
    "id": 1,
    "username": "john_doe"
  },
  "anime": {
    "id": 1,
    "title": "Attack on Titan"
  }
}
```

**Error Responses:**
- `400` - Invalid review ID format
- `404` - Review not found
- `500` - Server error

---

### Update Review

Modify a review (owner or admin only).

**Endpoint:** `PUT /api/reviews/:id`

**Authentication:** Required

**Path Parameters:**
- `id` - Review ID (integer)

**Request Body:**
```json
{
  "rating": "integer (1-10, optional)",
  "comment": "string (optional, non-empty if provided)"
}
```

**Request Example:**
```bash
curl -X PUT http://localhost:3000/api/reviews/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "rating": 10,
    "comment": "Updated: This is the best anime of all time"
  }'
```

**Success Response (200):**
```json
{
  "id": 1,
  "rating": 10,
  "comment": "Updated: This is the best anime of all time",
  "createdAt": "2026-03-21T11:00:00Z",
  "updatedAt": "2026-03-21T11:15:00Z",
  "userId": 1,
  "animeId": 1,
  "user": {
    "id": 1,
    "username": "john_doe"
  },
  "anime": {
    "id": 1,
    "title": "Attack on Titan"
  }
}
```

**Error Responses:**
- `400` - Invalid review ID or invalid data format
- `401` - Missing or invalid token
- `403` - User is not review owner and not admin
- `404` - Review not found
- `500` - Server error

**Authorization Rules:**
- Review owner can update own review
- Admin can update any review

---

### Delete Review

Remove a review (owner or admin only).

**Endpoint:** `DELETE /api/reviews/:id`

**Authentication:** Required

**Path Parameters:**
- `id` - Review ID (integer)

**Request Example:**
```bash
curl -X DELETE http://localhost:3000/api/reviews/1 \
  -H "Authorization: Bearer your-jwt-token"
```

**Success Response (200):**
```json
{
  "message": "Review deleted successfully"
}
```

**Error Responses:**
- `400` - Invalid review ID format
- `401` - Missing or invalid token
- `403` - User is not review owner and not admin
- `404` - Review not found
- `500` - Server error

**Authorization Rules:**
- Review owner can delete own review
- Admin can delete any review

---

## User Endpoints

### List All Users

Retrieve all users in the system (admin only).

**Endpoint:** `GET /api/users`

**Authentication:** Required (admin only)

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10, max: 100) - Results per page

**Request Example:**
```bash
curl "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer admin-token"
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "USER",
      "createdAt": "2026-03-21T10:30:00Z",
      "updatedAt": "2026-03-21T10:30:00Z"
    },
    {
      "id": 2,
      "username": "admin_user",
      "email": "admin@example.com",
      "role": "ADMIN",
      "createdAt": "2026-03-21T10:00:00Z",
      "updatedAt": "2026-03-21T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

**Error Responses:**
- `400` - Invalid pagination parameters
- `401` - Missing or invalid token
- `403` - User is not admin
- `500` - Server error

---

### Get User Profile

Retrieve user profile information (admin can view any, users can view own).

**Endpoint:** `GET /api/users/:id`

**Authentication:** Required

**Path Parameters:**
- `id` - User ID (integer)

**Request Example:**
```bash
curl http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer your-jwt-token"
```

**Success Response (200):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "USER",
  "createdAt": "2026-03-21T10:30:00Z",
  "updatedAt": "2026-03-21T10:30:00Z"
}
```

**Error Responses:**
- `400` - Invalid user ID format
- `401` - Missing or invalid token
- `403` - User can only access own profile
- `404` - User not found
- `500` - Server error

**Authorization Rules:**
- Admin can access any user profile
- Regular users can only access their own profile

---

### Get User Reviews

Retrieve all reviews by a specific user (admin or user itself).

**Endpoint:** `GET /api/users/:id/reviews`

**Authentication:** Required

**Path Parameters:**
- `id` - User ID (integer)

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10, max: 100) - Results per page

**Request Example:**
```bash
curl "http://localhost:3000/api/users/1/reviews?page=1&limit=5" \
  -H "Authorization: Bearer your-jwt-token"
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "rating": 9,
      "comment": "Amazing anime series",
      "createdAt": "2026-03-21T11:00:00Z",
      "updatedAt": "2026-03-21T11:00:00Z",
      "userId": 1,
      "animeId": 1,
      "anime": {
        "id": 1,
        "title": "Attack on Titan"
      }
    },
    {
      "id": 2,
      "rating": 8,
      "comment": "Really enjoyed this one",
      "createdAt": "2026-03-21T11:20:00Z",
      "updatedAt": "2026-03-21T11:20:00Z",
      "userId": 1,
      "animeId": 2,
      "anime": {
        "id": 2,
        "title": "Death Note"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 2,
    "totalPages": 1
  }
}
```

**Error Responses:**
- `400` - Invalid user ID or pagination parameters
- `401` - Missing or invalid token
- `403` - User can only view own reviews
- `404` - User not found
- `500` - Server error

**Authorization Rules:**
- Admin can access any user's reviews
- Regular users can only access their own reviews

---

## Data Models

### User Model

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key, auto-incremented |
| username | String (unique) | 3-30 characters, alphanumeric and underscore |
| email | String (unique) | Valid email format |
| passwordHash | String | Hashed password using bcryptjs |
| role | Enum (USER, ADMIN) | Access level, default USER |
| createdAt | DateTime | Account creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### Anime Model

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key, auto-incremented |
| title | String | Anime title |
| synopsis | String | Anime description |
| genre | String | Genre classification |
| releaseYear | Integer | Year of release (1900-2100) |
| createdAt | DateTime | Record creation timestamp |

### Review Model

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key, auto-incremented |
| rating | Integer | Rating 1-10 |
| comment | String | User's review text |
| userId | Integer | Foreign key to User |
| animeId | Integer | Foreign key to Anime |
| createdAt | DateTime | Review creation timestamp |
| updatedAt | DateTime | Last update timestamp |
| Unique Constraint | (userId, animeId) | One review per user per anime |

---

## Error Handling

All errors return appropriate HTTP status codes with descriptive error messages.

### Common Error Messages

| Status | Message | Cause |
|--------|---------|-------|
| 400 | "Invalid input" | Malformed request data |
| 401 | "Invalid email or password" | Wrong credentials |
| 403 | "Forbidden" | Insufficient permissions |
| 404 | "Not found" | Resource does not exist |
| 409 | "Conflict" | Duplicate or conflicting data |
| 500 | "Internal server error" | Server-side error |

---

## Pagination

List endpoints support pagination for large result sets:

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| page | 1 | N/A | Page number (1-indexed) |
| limit | 10 | 100 | Results per page |

Query Example:
```bash
GET /api/reviews?page=2&limit=20
```

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

Calculation: `totalPages = ceil(total / limit)`

---

## Testing the API

### Using curl

```bash
TOKEN="your-jwt-token"

curl -X GET http://localhost:3000/api/animes \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

1. Create a new request
2. Set method and URL
3. Go to Auth tab, select Bearer Token
4. Paste your JWT token
5. Send request

### Using JavaScript/Fetch

```javascript
const token = "your-jwt-token";

fetch("http://localhost:3000/api/animes", {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## Changelog

### Version 1.0.0

Initial API release with complete CRUD operations for animes, reviews, and users.

- User authentication (register, login)
- Anime management endpoints
- Review system with user and anime reviews
- User profile and review viewing
- Role-based access control
- Pagination support
- Comprehensive input validation
