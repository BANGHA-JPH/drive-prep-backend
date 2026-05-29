# DrivePrep Backend Authentication

Modular authentication system using Express, Node.js, Supabase PostgreSQL, JWT, and bcrypt.

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # Supabase connection
│   │   └── jwt.js            # JWT token generation & verification
│   ├── controllers/
│   │   └── authController.js # Auth business logic (signup, login, getCurrentUser)
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── routes/
│   │   └── auth.js           # Auth API routes
│   ├── utils/
│   │   └── validation.js     # Input validation utilities
│   └── migrations/
│       └── 001_create_users_table.sql # Database setup
├── .env.example              # Environment variables template
├── server.js                 # Express server entry point
└── package.json              # Dependencies
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. In your project settings, find:
   - Project URL
   - Anon Key
   - Service Role Key
3. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_secure_random_string
   PORT=5000
   ```

### 3. Create Database Table

1. In Supabase, go to SQL Editor
2. Create a new query and paste the contents of `src/migrations/001_create_users_table.sql`
3. Execute the query

### 4. Run the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Sign Up
- **POST** `/api/auth/signup`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }
  ```
- **Response:**
  ```json
  {
    "message": "User created successfully",
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
  ```

#### Login
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "SecurePass123"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
  ```

#### Get Current User (Protected)
- **GET** `/api/auth/me`
- **Headers:**
  ```
  Authorization: Bearer eyJhbGciOi...
  ```
- **Response:**
  ```json
  {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-03-13T10:30:00"
    }
  }
  ```

## Password Requirements

- Minimum 6 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## JWT Token

- Expires in 7 days (configurable via `JWT_EXPIRE`)
- Sent in Authorization header as: `Bearer <token>`
- Token contains: `{ id, email, iat, exp }`

## Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT token-based authentication
- ✅ CORS enabled
- ✅ Input validation
- ✅ Protected routes with middleware
- ✅ Error handling

## Next Steps

1. Connect your React Native frontend to these endpoints
2. Store JWT token in AsyncStorage on the client
3. Add token to request headers for protected endpoints
4. Implement logout functionality (clear token on client)
5. Add refresh token mechanism for better security
