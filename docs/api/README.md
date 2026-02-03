# API Documentation

This document provides comprehensive API documentation for Enrichify's REST API and WebSocket endpoints.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://api.yourdomain.com`

## Authentication

Enrichify uses JWT (JSON Web Token) authentication.

### Obtaining a Token

**POST** `/auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user"
  }
}
```

### Using the Token

Include the token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## REST API Endpoints

### Authentication

#### Login
- **POST** `/auth/login`
- **Body**: `{ email, password }`
- **Response**: `{ access_token, user }`

#### Get Current User
- **GET** `/auth/me`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ id, email, name, role }`

### Users

#### List Users (Admin Only)
- **GET** `/users`
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
- **Response**: `{ data: User[], total: number, page: number }`

#### Get User
- **GET** `/users/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `User`

#### Create User (Admin Only)
- **POST** `/users`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `{ email, password, name, role }`
- **Response**: `User`

#### Update User
- **PATCH** `/users/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `{ email?, name?, role? }`
- **Response**: `User`

#### Delete User (Admin Only)
- **DELETE** `/users/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ success: true }`

### Websets

#### List Websets
- **GET** `/websets`
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
- **Response**: `{ data: Webset[], total: number }`

#### Get Webset
- **GET** `/websets/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `Webset`

#### Create Webset
- **POST** `/websets`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "name": "My Leads",
  "description": "Customer leads from Q4",
  "columns": [
    { "name": "Name", "type": "text" },
    { "name": "Email", "type": "email" },
    { "name": "Company", "type": "text" }
  ]
}
```
- **Response**: `Webset`

#### Update Webset
- **PATCH** `/websets/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `{ name?, description? }`
- **Response**: `Webset`

#### Delete Webset
- **DELETE** `/websets/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ success: true }`

#### Add Row
- **POST** `/websets/:id/rows`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "data": {
    "Name": "John Doe",
    "Email": "john@example.com",
    "Company": "Acme Inc"
  }
}
```
- **Response**: `Row`

#### Update Row
- **PATCH** `/websets/:websetId/rows/:rowId`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `{ data: { ... } }`
- **Response**: `Row`

#### Delete Row
- **DELETE** `/websets/:websetId/rows/:rowId`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ success: true }`

#### Add Column
- **POST** `/websets/:id/columns`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `{ name: "Phone", type: "text" }`
- **Response**: `Column`

#### Update Column
- **PATCH** `/websets/:websetId/columns/:columnId`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `{ name?: string, type?: string }`
- **Response**: `Column`

#### Delete Column
- **DELETE** `/websets/:websetId/columns/:columnId`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ success: true }`

#### Export Webset
- **GET** `/websets/:id/export`
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**:
  - `format`: `csv` or `json`
- **Response**: File download

### Enrichment

#### Enrich Webset
- **POST** `/websets/:id/enrich`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "prompt": "Find email addresses for each person",
  "targetColumn": "Email",
  "llmProvider": "openai",
  "llmModel": "gpt-4",
  "searchProvider": "exa"
}
```
- **Response**: `{ jobId: string }`

#### Get Enrichment Status
- **GET** `/enrichment/jobs/:jobId`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
```json
{
  "id": "job-uuid",
  "status": "processing",
  "progress": 45,
  "total": 100,
  "completed": 45,
  "failed": 2,
  "startedAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:05:00Z"
}
```

#### Cancel Enrichment Job
- **POST** `/enrichment/jobs/:jobId/cancel`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ success: true }`

### Providers

#### List LLM Providers
- **GET** `/providers/llm`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
```json
[
  {
    "id": "openai",
    "name": "OpenAI",
    "models": ["gpt-4", "gpt-3.5-turbo"],
    "configured": true
  },
  {
    "id": "anthropic",
    "name": "Anthropic Claude",
    "models": ["claude-3-opus", "claude-3-sonnet"],
    "configured": false
  }
]
```

#### List Search Providers
- **GET** `/providers/search`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
```json
[
  {
    "id": "exa",
    "name": "Exa",
    "configured": true
  },
  {
    "id": "tavily",
    "name": "Tavily",
    "configured": false
  }
]
```

#### Configure Provider (Admin Only)
- **POST** `/providers/configure`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "providerId": "openai",
  "apiKey": "sk-...",
  "config": {
    "model": "gpt-4"
  }
}
```
- **Response**: `{ success: true }`

## WebSocket API

### Connection

Connect to the WebSocket server at:
- **Development**: `ws://localhost:3001`
- **Production**: `wss://api.yourdomain.com`

Include the JWT token in the connection:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events

#### Client → Server

##### Join Chat Room
```javascript
socket.emit('chat:join', { roomId: 'room-uuid' });
```

##### Send Message
```javascript
socket.emit('chat:message', {
  roomId: 'room-uuid',
  content: 'Find information about Tesla',
  llmProvider: 'openai',
  llmModel: 'gpt-4',
  searchProvider: 'exa'
});
```

##### Leave Chat Room
```javascript
socket.emit('chat:leave', { roomId: 'room-uuid' });
```

#### Server → Client

##### Message Response (Streaming)
```javascript
socket.on('chat:response:chunk', (data) => {
  console.log(data.chunk); // Partial response
});

socket.on('chat:response:complete', (data) => {
  console.log(data.message); // Full message
  console.log(data.citations); // Source citations
});
```

##### Enrichment Progress
```javascript
socket.on('enrichment:progress', (data) => {
  console.log(`Progress: ${data.completed}/${data.total}`);
  console.log(`Status: ${data.status}`);
});

socket.on('enrichment:complete', (data) => {
  console.log('Enrichment completed');
  console.log(data.results);
});
```

##### Error Handling
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

## Error Responses

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message or array of messages",
  "error": "Bad Request"
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Default**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **WebSocket**: 60 messages per minute per connection

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Pagination

List endpoints support pagination with query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Response format:
```json
{
  "data": [...],
  "total": 250,
  "page": 1,
  "limit": 10,
  "totalPages": 25
}
```

## Filtering & Sorting

Some endpoints support filtering and sorting:

### Filtering
```
GET /websets?name=leads&status=active
```

### Sorting
```
GET /websets?sortBy=createdAt&sortOrder=desc
```

## Webhooks (Future Feature)

Webhooks will allow you to receive real-time notifications:

```json
{
  "event": "enrichment.completed",
  "data": {
    "jobId": "job-uuid",
    "websetId": "webset-uuid",
    "status": "completed",
    "completedAt": "2024-01-01T00:10:00Z"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Login
const { data } = await api.post('/auth/login', {
  email: 'user@example.com',
  password: 'password',
});

// Set token for future requests
api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;

// Get websets
const websets = await api.get('/websets');
```

### Python

```python
import requests

BASE_URL = "http://localhost:3001"

# Login
response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "user@example.com",
    "password": "password"
})
token = response.json()["access_token"]

# Set headers
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Get websets
response = requests.get(f"{BASE_URL}/websets", headers=headers)
websets = response.json()
```

### cURL

```bash
# Login
TOKEN=$(curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.access_token')

# Get websets
curl http://localhost:3001/websets \
  -H "Authorization: Bearer $TOKEN"
```

## Testing

### Postman Collection

Import the Postman collection from `docs/api/postman-collection.json` for easy testing.

### Swagger/OpenAPI

Interactive API documentation available at:
- Development: `http://localhost:3001/api/docs`

## Support

For API issues or questions:
- Check the [Troubleshooting Guide](../guides/TROUBLESHOOTING.md)
- Review [Architecture Documentation](../ARCHITECTURE.md)
- Open an issue on GitHub
