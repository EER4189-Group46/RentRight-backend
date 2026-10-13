# RentRight Backend API (Authentication & User Module)

A modular, loosely coupled RESTful backend API built with **Node.js** and **Express.js**, designed to interface with the RentRight React frontend.

---

## 🏗️ Architecture & Design Principles

The backend is built following **Clean Layered Architecture** with strict **Separation of Concerns** to ensure high maintainability, testability, and loose coupling:

```
           [ Client / Frontend (Vite React @ :3000) ]
                              │
                    HTTP Requests via /api
                              │
                      [ Express App ]
                              │
                  ┌───────────┴───────────┐
                  ▼                       ▼
          [ Middlewares ]         [ Routes Layer ]
       (CORS, Auth, Validate)     (auth.routes, user.routes)
                                          │
                                          ▼
                                 [ Controllers Layer ]
                             (auth.controller, user.controller)
                                          │
                                          ▼
                                  [ Services Layer ]
                              (auth.service, user.service)
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
              [ Repositories Layer ]               [ Notification Layer ]
             (user.repo, token.repo)                  (email.service)
                        │
                        ▼
             [ MySQL 8.0 Database ]
             (Database: rentright_db)
```

### Key Modular Design Highlights:
1. **Separation of Business Logic (Services)**:
   - Services contain pure domain logic (passwords, tokens, validation rules).
   - They do **not** depend on Express `req` or `res`. This enables easy unit testing and framework portability.
2. **Repository Pattern (Data Access Layer)**:
   - The controllers and services do not execute SQL queries directly.
   - All persistence is encapsulated inside `UserRepository` and `TokenRepository` powered by `mysql2/promise` connection pool.
   - Loosely coupled and easily swappable if you ever need MongoDB or PostgreSQL.
3. **Pluggable Notification Service**:
   - `email.service.js` is an isolated module. In development, reset links and tokens are logged to the console and returned in dev mode; in production, it easily plugs into Nodemailer, SendGrid, or AWS SES.
4. **Centralized Error & Response Formatting**:
   - Standard response envelope: `{ success: true, message: string, data: any }` or `{ success: false, message: string, errors: any }`.
   - Domain errors (`AppError`, `BadRequestError`, `UnauthorizedError`, `ConflictError`, `NotFoundError`) are handled cleanly by the global error middleware.

---

## 📁 Directory Structure

```
backend/
├── .env                  # Environment variables (PORT, JWT_SECRET, etc.)
├── .env.example          # Environment template
├── package.json          # Node.js project manifest (type: module)
├── README.md             # Architecture documentation & API guide
├── data/
│   └── rentright.db      # SQLite database file (created automatically)
├── test/
│   └── auth-integration.test.js  # Automated integration tests
└── src/
    ├── app.js            # Express app configuration & middleware pipeline
    ├── server.js         # Entrypoint, DB initializer, server listener & graceful shutdown
    ├── config/
    │   └── env.js        # Environment variable loader and fallback defaults
    ├── database/
    │   ├── db.js         # SQLite database connector (WAL mode & foreign keys enabled)
    │   └── schema.sql    # Relational schema (users, password_reset_tokens)
    ├── repositories/
    │   ├── user.repository.js    # Data access for users
    │   └── token.repository.js   # Data access for password reset tokens
    ├── services/
    │   ├── auth.service.js       # Register, login, forgot password, reset password
    │   ├── user.service.js       # User profile operations
    │   └── email.service.js      # Password reset notifications
    ├── controllers/
    │   ├── auth.controller.js    # HTTP handlers for auth routes
    │   └── user.controller.js    # HTTP handlers for user routes
    ├── middlewares/
    │   ├── auth.middleware.js    # JWT Bearer token authentication & role authorization
    │   ├── validate.middleware.js# Request payload validation
    │   └── error.middleware.js   # Centralized error handler & 404 handler
    ├── utils/
    │   ├── errors.js             # Semantic HTTP Error classes
    │   ├── jwt.util.js           # JWT signing and verification
    │   ├── password.util.js      # Bcrypt password hashing and comparison
    │   └── response.util.js      # Standard client response helper
    └── routes/
        ├── index.js              # Aggregate router mounting /api/auth & /api/users
        ├── auth.routes.js        # Authentication endpoints
        └── user.routes.js        # User endpoints
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
The server will start at `http://localhost:5000`.

### 3. Run Automated Integration Tests
```bash
node test/auth-integration.test.js
```

---

## 📡 API Reference

### Base URL: `http://localhost:5000/api`

### 1. Public Health Check
- **Endpoint**: `GET /health`
- **Response**:
  ```json
  {
    "success": true,
    "message": "RentRight API is running.",
    "timestamp": "2026-10-12T09:30:00.000Z"
  }
  ```

---

### 2. User Registration
- **Endpoint**: `POST /auth/register`
- **Payload**:
  ```json
  {
    "name": "Kasun Perera",
    "email": "kasun@example.com",
    "password": "password123",
    "phone": "0771234567",
    "role": "renter",
    "provider_type": "individual",
    "business_name": null
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Account registered successfully.",
    "data": {
      "user": {
        "id": 1,
        "name": "Kasun Perera",
        "email": "kasun@example.com",
        "phone": "0771234567",
        "role": "renter",
        "provider_type": "individual",
        "business_name": null,
        "created_at": "2026-10-12 09:30:00",
        "updated_at": "2026-10-12 09:30:00"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

---

### 3. User Login
- **Endpoint**: `POST /auth/login`
- **Payload**:
  ```json
  {
    "email": "kasun@example.com",
    "password": "password123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Logged in successfully.",
    "data": {
      "user": {
        "id": 1,
        "name": "Kasun Perera",
        "email": "kasun@example.com",
        "role": "renter"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

---

### 4. Forgot Password
- **Endpoint**: `POST /auth/forgot-password`
- **Payload**:
  ```json
  {
    "email": "kasun@example.com"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "If an account with that email exists, password reset instructions have been sent.",
    "data": {
      "message": "...",
      "devToken": "c4d3e8f..." // Included in development mode for easy testing
    }
  }
  ```

---

### 5. Reset Password
- **Endpoint**: `POST /auth/reset-password`
- **Payload**:
  ```json
  {
    "token": "c4d3e8f...",
    "newPassword": "newPassword123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Password has been reset successfully. You can now log in with your new password.",
    "data": null
  }
  ```

---

### 6. Get Current User Profile (Protected)
- **Endpoint**: `GET /users/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Profile fetched successfully.",
    "data": {
      "id": 1,
      "name": "Kasun Perera",
      "email": "kasun@example.com",
      "phone": "0771234567",
      "role": "renter",
      "created_at": "2026-10-12 09:30:00"
    }
  }
  ```

---

### 7. Update Current User Profile (Protected)
- **Endpoint**: `PUT /users/me`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "name": "Kasun Perera Updated",
    "phone": "0779998888"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Profile updated successfully.",
    "data": {
      "id": 1,
      "name": "Kasun Perera Updated",
      "email": "kasun@example.com",
      "phone": "0779998888",
      "role": "renter"
    }
  }
  ```

---

### 8. Change Password (Protected)
- **Endpoint**: `POST /auth/change-password`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "currentPassword": "password123",
    "newPassword": "newPassword456"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Password changed successfully.",
    "data": null
  }
  ```

---

### 9. Get Categories
- **Endpoint**: `GET /categories`
- **Response** (`200 OK`): Returns array of all rental categories (Power Tools, Photography, Camping, etc.).

---

### 10. Search & Filter Rental Items
- **Endpoint**: `GET /items`
- **Query Parameters**:
  - `keyword`: text search matching name, description, and category
  - `category_id`: category ID filter (e.g. `1`, `2`, `3`)
  - `min_price`: minimum price per day in LKR (e.g. `2000`)
  - `max_price`: maximum price per day in LKR (e.g. `5000`)
  - `location`: location substring search (e.g. `Colombo`, `Kandy`, `Galle`)
  - `sort`: `'newest'` (default), `'price_asc'`, `'price_desc'`
  - `status`: `'available'` (default)
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Items retrieved successfully.",
    "data": [
      {
        "id": 1,
        "name": "Bosch Professional Rotary Hammer Drill 800W",
        "description": "Heavy duty concrete and masonry rotary hammer drill...",
        "price_per_day": 1800,
        "location": "Colombo 03",
        "category_name": "Power Tools & Construction",
        "provider_name": "Colombo Heavy Rentals",
        "images": ["https://images.unsplash.com/..."]
      }
    ]
  }
  ```

---

### 11. Get Item Details
- **Endpoint**: `GET /items/:id`
- **Response** (`200 OK`): Full item record including provider info and parsed images array.

---

### 12. Provider My Items (Protected)
- **Endpoint**: `GET /items/mine`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`): Returns all items belonging to the authenticated provider.

---

### 13. Create Item Listing (Protected, Provider Only)
- **Endpoint**: `POST /items`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "name": "Sony FE 70-200mm f/2.8 GM Lens",
    "category_id": 2,
    "price_per_day": 4500,
    "location": "Colombo 03",
    "images": ["https://..."]
  }
  ```

---

### 14. Create Rental Request (Protected, Renter)
- **Endpoint**: `POST /rental-requests`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "item_id": 1,
    "start_date": "2026-10-20",
    "end_date": "2026-10-23"
  }
  ```
- **Response** (`201 Created`): Creates pending request `#REQ-1`.

---

### 15. View My Rental Requests (Protected, Renter)
- **Endpoint**: `GET /rental-requests/mine`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`): List of requests submitted by the renter with item name, provider name, dates, status, and payment status.

---

### 16. View Incoming Rental Requests (Protected, Provider)
- **Endpoint**: `GET /rental-requests/provider`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`): List of incoming customer requests for equipment owned by this provider.

---

### 17. Accept or Reject Request (Protected, Provider)
- **Endpoint**: `PUT /rental-requests/:id/status`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "status": "accepted"
  }
  ```
- **Response** (`200 OK`): Updates status to `'accepted'` (or `'rejected'`).

---

### 18. Process Rental Payment (Protected, Renter)
- **Endpoint**: `POST /payments`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "rental_request_id": 1,
    "payment_method": "card"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Payment completed successfully. Your rental booking is confirmed!",
    "data": {
      "payment_id": 1,
      "rental_request_id": 1,
      "transaction_id": "RR-SIM-1791868665113-62931",
      "amount": 7200,
      "days": 4,
      "item_name": "Bosch Professional Rotary Hammer Drill 800W",
      "status": "completed"
    }
  }
  ```

---

### 19. My Payment History & Receipts (Protected, Renter)
- **Endpoint**: `GET /payments/mine`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`): Completed rental receipts with item name, provider name, transaction reference, amount, and dates.

---

### 20. Provider Earnings Dashboard (Protected, Provider)
- **Endpoint**: `GET /payments/earnings`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "total_earnings": 14400,
      "completed_rentals_count": 2,
      "avg_booking_value": 7200,
      "payments": [ ... ]
    }
  }
  ```

---

## 🔌 Frontend Connection

The React frontend (in `../frontend`) includes a Vite proxy configuration in [vite.config.js](file:///D:/MyProjects/anti%20project/rentright/frontend/vite.config.js):
```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```
Any request from the frontend to `/api/*` is transparently forwarded to `http://localhost:5000/api/*`, eliminating CORS issues during development.
#   R e n t R i g h t - b a c k e n d  
 