# Authentication Quick Start Guide

## Setup

1. Set required environment variable:
```bash
export JWT_SECRET=your-strong-secret-key-here
```

2. Start the backend:
```bash
npm run start:dev
```

## Usage Examples

### Register a New User
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123"
  }'
```

Response:
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

### Get Current User (Protected)
```bash
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Admin Endpoints

All user management endpoints require admin role:

```bash
# List all users
curl -X GET http://localhost:3001/users \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

# Create user with specific role
curl -X POST http://localhost:3001/users \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin"
  }'

# Update user
curl -X PATCH http://localhost:3001/users/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin",
    "isActive": true
  }'

# Delete user
curl -X DELETE http://localhost:3001/users/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

## TypeScript Usage

### Protect Routes
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Get('protected')
@UseGuards(JwtAuthGuard)
async protectedRoute(@Request() req) {
  // req.user contains the authenticated user
  return { user: req.user };
}
```

### Admin-Only Routes
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@Get('admin-only')
@UseGuards(JwtAuthGuard, AdminGuard)
async adminRoute() {
  return { message: 'Admin access granted' };
}
```

### Using AuthUtils
```typescript
import { AuthUtils } from './utils/auth.utils';

// Hash a password
const hashed = await AuthUtils.hashPassword('password123');

// Compare passwords
const isValid = await AuthUtils.comparePasswords('password123', hashed);

// Convert user entity to response DTO
const userResponse = AuthUtils.toUserResponse(user);
```

## Security Notes

- JWT_SECRET must be set (application will not start without it)
- Passwords are hashed with bcrypt (10 salt rounds)
- JWT tokens expire after 24 hours
- Inactive users cannot authenticate
- Admin actions require both authentication and admin role
- All DTOs are validated automatically

For more details, see AUTH_README.md
