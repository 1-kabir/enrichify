# Enrichify Backend Authentication System

## Overview

This authentication system provides secure user registration, login, and authorization using JWT tokens with role-based access control (RBAC).

## Features

- **User Registration & Login**: Secure authentication with bcrypt password hashing
- **JWT Token-based Authentication**: Stateless authentication using JSON Web Tokens
- **Role-Based Access Control**: Support for admin and regular user roles
- **Protected Routes**: Guards to protect endpoints requiring authentication
- **Admin-Only Routes**: Special guard for admin-only operations
- **User Management**: CRUD operations for users (admin only)
- **Database Entities**: User, UserApiKey, and RateLimit entities

## Architecture

### Modules

#### AuthModule
- **AuthService**: Handles registration, login, JWT generation, and password hashing
- **AuthController**: Exposes authentication endpoints
- **JwtStrategy**: Passport strategy for JWT validation

#### UsersModule
- **UsersService**: CRUD operations for user management
- **UsersController**: Admin-only endpoints for user management

### Database Entities

#### User Entity
```typescript
{
  id: UUID (Primary Key)
  username: string (unique)
  email: string (unique)
  password: string (hashed)
  role: enum ('admin' | 'user')
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### UserApiKey Entity
```typescript
{
  id: UUID
  user: User (ManyToOne)
  provider: string
  encryptedKey: string
  label: string (optional)
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### RateLimit Entity
```typescript
{
  id: UUID
  scope: enum ('user' | 'global')
  userId: string (optional)
  endpoint: string
  maxRequests: number
  windowMs: number
  currentCount: number
  windowStart: Date
  createdAt: Date
  updatedAt: Date
}
```

## API Endpoints

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "id": "uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "role": "user",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### POST /auth/login
Authenticate and receive JWT token.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### GET /auth/me
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "id": "uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "role": "user",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### User Management Endpoints (Admin Only)

All endpoints require:
- JWT authentication (Authorization header)
- Admin role

#### POST /users
Create a new user (admin can specify role).

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "admin"
}
```

#### GET /users
List all users.

**Response:**
```json
[
  {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /users/:id
Get a specific user by ID.

#### PATCH /users/:id
Update a user.

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "role": "admin",
  "isActive": false
}
```

#### DELETE /users/:id
Delete a user.

## Security Features

### Password Hashing
- Uses bcrypt with 10 salt rounds
- Passwords are never stored in plain text
- Secure password comparison

### JWT Tokens
- Default expiration: 24 hours
- Secret key configurable via environment variable
- Payload includes: user ID, username, and role

### Guards

#### JwtAuthGuard
Protects routes requiring authentication. Validates JWT token and attaches user to request.

**Usage:**
```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
async protectedRoute(@Request() req) {
  return { user: req.user };
}
```

#### AdminGuard
Ensures the authenticated user has admin role.

**Usage:**
```typescript
@UseGuards(JwtAuthGuard, AdminGuard)
@Get('admin-only')
async adminRoute() {
  return { message: 'Admin access granted' };
}
```

## Environment Variables

**Required Environment Variables:**

```env
# JWT Configuration (REQUIRED)
JWT_SECRET=your-secret-key-change-in-production

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=enrichify
DATABASE_PASSWORD=password
DATABASE_NAME=enrichify

# Redis Configuration (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Important:** `JWT_SECRET` is required and the application will throw an error on startup if not set. Use a strong, randomly generated secret in production.

## Validation

All DTOs use class-validator decorators:
- **@IsString()**: Validates string type
- **@IsEmail()**: Validates email format
- **@IsNotEmpty()**: Ensures field is not empty
- **@MinLength()**: Enforces minimum string length
- **@IsEnum()**: Validates enum values
- **@IsOptional()**: Marks field as optional
- **@IsBoolean()**: Validates boolean type

Global validation pipe is configured with:
- `whitelist: true` - Strips non-whitelisted properties
- `forbidNonWhitelisted: true` - Throws error for extra properties
- `transform: true` - Transforms payloads to DTO instances

## Error Handling

The system throws appropriate HTTP exceptions:
- **ConflictException (409)**: Username or email already exists
- **UnauthorizedException (401)**: Invalid credentials or inactive account
- **NotFoundException (404)**: User not found
- **ForbiddenException (403)**: Insufficient permissions (non-admin)
- **BadRequestException (400)**: Validation errors

## Usage Examples

### Client-side Authentication Flow

```typescript
// 1. Register
const registerResponse = await fetch('http://localhost:3001/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    email: 'john@example.com',
    password: 'securepassword123'
  })
});

// 2. Login
const loginResponse = await fetch('http://localhost:3001/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    password: 'securepassword123'
  })
});

const { accessToken } = await loginResponse.json();

// 3. Access protected route
const meResponse = await fetch('http://localhost:3001/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const user = await meResponse.json();
```

## Development

### Build
```bash
npm run build
```

### Start Development Server
```bash
npm run start:dev
```

### Run Tests
```bash
npm run test
```

### Lint
```bash
npm run lint
```

## Future Enhancements

- Email verification for registration
- Password reset functionality
- Refresh tokens for extended sessions
- Rate limiting implementation using RateLimit entity
- Account lockout after failed login attempts
- Two-factor authentication (2FA)
- OAuth integration (Google, GitHub, etc.)
- Audit logging for security events
