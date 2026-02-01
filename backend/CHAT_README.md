# Chat System Documentation

## Overview

The Enrichify chat system enables users to interact with their websets through an AI-powered conversational interface. Users can ask questions about their data, query cell details, understand confidence scores, examine citations, and even trigger enrichment operations—all through natural language.

## Architecture

### Entities

#### ChatConversation
- **Table**: `chat_conversations`
- **Fields**:
  - `id` (UUID): Primary key
  - `websetId` (UUID): Foreign key to websets
  - `userId` (UUID): Foreign key to users
  - `title` (String): Conversation title
  - `createdAt` (Timestamp): Creation date
  - `updatedAt` (Timestamp): Last update date

#### ChatMessage
- **Table**: `chat_messages`
- **Fields**:
  - `id` (UUID): Primary key
  - `conversationId` (UUID): Foreign key to conversations
  - `role` (Enum): `user`, `assistant`, or `system`
  - `content` (Text): Message content
  - `metadata` (JSONB): Additional metadata (model info, tokens, etc.)
  - `createdAt` (Timestamp): Creation date

### Modules

#### ChatModule
Integrates all chat-related functionality:
- **Imports**: TypeORM entities, ProvidersModule, EnrichmentModule
- **Providers**: ChatService, ChatGateway
- **Controllers**: ChatController
- **Exports**: ChatService

### Services

#### ChatService
Core business logic for chat operations:

**Key Methods**:
- `createConversation(dto, userId)`: Create new conversation
- `findAllConversations(userId)`: Get user's conversations
- `findConversationsByWebset(websetId, userId)`: Get conversations for a specific webset
- `findConversation(id, userId)`: Get conversation with messages
- `updateConversation(id, dto, userId)`: Update conversation title
- `deleteConversation(id, userId)`: Delete conversation
- `getMessages(conversationId, userId)`: Get conversation messages
- `sendMessage(conversationId, dto, userId)`: Send message and get AI response
- `getCellDetails(websetId, row, column, userId)`: Get cell information
- `getCitationsForCell(websetId, row, column, userId)`: Get citations for a cell
- `triggerEnrichment(conversationId, websetId, column, rows, userId)`: Trigger enrichment job

**Context Building**:
The service builds rich context for the LLM including:
- Webset name and description
- Column definitions
- Sample data from cells
- Confidence scores
- Citation information

### Controllers

#### ChatController
RESTful API endpoints:

**Endpoints**:
- `POST /chat/conversations`: Create conversation
- `GET /chat/conversations`: List all conversations
- `GET /chat/conversations/webset/:websetId`: List conversations for webset
- `GET /chat/conversations/:id`: Get conversation details
- `PATCH /chat/conversations/:id`: Update conversation
- `DELETE /chat/conversations/:id`: Delete conversation
- `GET /chat/conversations/:id/messages`: Get messages
- `POST /chat/conversations/:id/messages`: Send message
- `GET /chat/websets/:websetId/cell/:row/:column`: Get cell details
- `GET /chat/websets/:websetId/cell/:row/:column/citations`: Get cell citations

All endpoints require JWT authentication via `JwtAuthGuard`.

### WebSocket Gateway

#### ChatGateway
Real-time messaging using Socket.IO:

**Connection**: 
- Namespace: `/chat`
- CORS enabled for all origins

**Events**:

**Client → Server**:
- `authenticate`: Authenticate user
  ```json
  { "userId": "uuid" }
  ```
- `joinConversation`: Join conversation room
  ```json
  { "conversationId": "uuid", "userId": "uuid" }
  ```
- `leaveConversation`: Leave conversation room
  ```json
  { "conversationId": "uuid", "userId": "uuid" }
  ```
- `sendMessage`: Send message with immediate response
  ```json
  { "conversationId": "uuid", "content": "message", "userId": "uuid" }
  ```
- `streamMessage`: Send message with streaming response
  ```json
  { "conversationId": "uuid", "content": "message", "userId": "uuid" }
  ```

**Server → Client**:
- `messageReceived`: New message received
  ```json
  { "message": ChatMessage }
  ```
- `assistantTyping`: Assistant typing indicator
  ```json
  { "typing": true/false }
  ```
- `streamStart`: Stream started
  ```json
  { "conversationId": "uuid" }
  ```
- `streamChunk`: Stream chunk received
  ```json
  { "chunk": "text", "accumulated": "full text so far" }
  ```
- `streamEnd`: Stream completed
  ```json
  { "conversationId": "uuid", "messageId": "uuid" }
  ```
- `streamError`: Stream error occurred
  ```json
  { "error": "error message" }
  ```
- `error`: General error
  ```json
  { "error": "error message" }
  ```

## AI Assistant Capabilities

The AI assistant has deep integration with webset data:

### 1. Data Structure Questions
- "What columns are in this webset?"
- "How many rows of data do I have?"
- "What type is the email column?"

### 2. Cell Data Queries
- "What's the value in row 5, column 'email'?"
- "Show me the first few rows of data"

### 3. Confidence Score Analysis
- "What is the confidence score for cell at row 3, column 'company'?"
- "Which cells have low confidence scores?"

### 4. Citation Information
- "What resources were used for row 2, column 'phone'?"
- "Show me the citations for this cell"

### 5. Data Quality Insights
- "Which rows have missing data?"
- "What's the average confidence score?"

### 6. Enrichment Guidance
- "How can I enrich the 'job_title' column?"
- "What data can I add to improve this webset?"

## Integration Points

### LLM Provider Integration
The chat system uses the existing `LLMProvidersService` to:
- Make requests to configured LLM providers
- Handle rate limiting
- Track token usage
- Retry on failures

### Webset Data Integration
Full access to webset information:
- Column definitions and types
- Cell values and metadata
- Confidence scores
- Citations and sources

### Enrichment Integration
Can trigger enrichment jobs through the `EnrichmentService`:
- Queue enrichment tasks
- Monitor job status
- Provide enrichment recommendations

## Usage Examples

### REST API Example

```bash
# Create a conversation
curl -X POST http://localhost:3000/chat/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "websetId": "webset-uuid",
    "title": "Questions about my customer data"
  }'

# Send a message
curl -X POST http://localhost:3000/chat/conversations/CONVERSATION_ID/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What is the confidence score for row 1, column email?"
  }'

# Get cell details
curl -X GET http://localhost:3000/chat/websets/WEBSET_ID/cell/1/email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get citations
curl -X GET http://localhost:3000/chat/websets/WEBSET_ID/cell/1/email/citations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### WebSocket Example (JavaScript)

```javascript
import { io } from 'socket.io-client';

// Connect to chat namespace
const socket = io('http://localhost:3000/chat', {
  transports: ['websocket'],
});

// Authenticate
socket.emit('authenticate', { userId: 'user-uuid' });

// Join conversation
socket.emit('joinConversation', {
  conversationId: 'conversation-uuid',
  userId: 'user-uuid',
});

// Listen for messages
socket.on('messageReceived', (data) => {
  console.log('New message:', data.message);
});

// Listen for typing indicator
socket.on('assistantTyping', (data) => {
  console.log('Assistant typing:', data.typing);
});

// Send message
socket.emit('sendMessage', {
  conversationId: 'conversation-uuid',
  content: 'What columns are in this webset?',
  userId: 'user-uuid',
});

// Stream message (with word-by-word delivery)
socket.emit('streamMessage', {
  conversationId: 'conversation-uuid',
  content: 'Explain the data quality in this webset',
  userId: 'user-uuid',
});

socket.on('streamStart', (data) => {
  console.log('Stream started');
});

socket.on('streamChunk', (data) => {
  console.log('Chunk:', data.chunk);
  console.log('Accumulated:', data.accumulated);
});

socket.on('streamEnd', (data) => {
  console.log('Stream ended:', data.messageId);
});

socket.on('error', (data) => {
  console.error('Error:', data.error);
});
```

## System Prompt

The AI assistant operates with a system prompt that provides:
- Current webset context (name, description, columns)
- Sample data (first 5 rows with up to 50 cells)
- Confidence scores and citation counts
- Capability descriptions
- Usage guidelines

The context is dynamically built for each conversation based on the associated webset.

## Security

- **Authentication**: All REST endpoints require JWT authentication
- **Authorization**: Users can only access their own conversations and websets
- **WebSocket Auth**: WebSocket connections should authenticate before joining rooms
- **Data Isolation**: Each conversation is scoped to a specific webset and user

## Performance Considerations

1. **Context Limiting**: Sample data limited to 50 cells and 5 rows to manage token usage
2. **Message History**: Only last 10 messages sent to LLM to control context size
3. **Streaming**: Simulated streaming breaks responses into words with 50ms delays
4. **Caching**: LLM provider clients are cached for performance
5. **Rate Limiting**: Integrated with existing rate limiting system

## Future Enhancements

Potential improvements:
- Real streaming from LLM providers (OpenAI, Claude, etc.)
- Conversation branching and forking
- Message editing and regeneration
- Export conversation history
- Conversation search and filtering
- Multi-modal support (images, charts)
- Collaborative conversations (multiple users)
- Conversation templates and presets

## Dependencies

- `@nestjs/websockets`: WebSocket support
- `@nestjs/platform-socket.io`: Socket.IO integration
- `socket.io`: Real-time bidirectional communication
- Existing dependencies: TypeORM, LLM providers, enrichment system

## Testing

To test the chat system:

1. Start the backend server
2. Ensure PostgreSQL and Redis are running
3. Configure at least one active LLM provider
4. Create a webset with some data
5. Use REST API or WebSocket client to interact with chat
6. Monitor logs for LLM requests and responses

## Troubleshooting

**No LLM provider found**:
- Ensure at least one LLM provider is configured and active
- Check provider API keys and configuration

**WebSocket connection fails**:
- Verify CORS settings
- Check firewall rules
- Ensure client is connecting to correct namespace (`/chat`)

**Messages not streaming**:
- Current implementation simulates streaming
- For real streaming, LLM provider must support it

**Context too large**:
- Reduce sample cell count in `buildWebsetContext`
- Limit message history further
- Use smaller LLM models

## API Reference

See inline TypeScript documentation in:
- `src/chat/chat.service.ts`
- `src/chat/chat.controller.ts`
- `src/chat/chat.gateway.ts`
