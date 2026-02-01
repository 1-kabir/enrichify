# Chat System Testing Guide

## Prerequisites

1. Backend server running on `http://localhost:3000`
2. PostgreSQL database running
3. Redis running (for BullMQ)
4. At least one active LLM provider configured
5. User account created and authenticated
6. At least one webset with data

## REST API Testing

### 1. Create a Conversation

```bash
# Set your JWT token
export JWT_TOKEN="your-jwt-token-here"
export WEBSET_ID="your-webset-id-here"

# Create conversation
curl -X POST http://localhost:3000/chat/conversations \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "websetId": "'$WEBSET_ID'",
    "title": "My first conversation"
  }'

# Save the conversation ID from the response
export CONVERSATION_ID="conversation-id-from-response"
```

### 2. List All Conversations

```bash
curl -X GET http://localhost:3000/chat/conversations \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 3. List Conversations for a Webset

```bash
curl -X GET http://localhost:3000/chat/conversations/webset/$WEBSET_ID \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 4. Get Conversation Details

```bash
curl -X GET http://localhost:3000/chat/conversations/$CONVERSATION_ID \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 5. Send a Message

```bash
# Ask about webset structure
curl -X POST http://localhost:3000/chat/conversations/$CONVERSATION_ID/messages \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What columns are in this webset?"
  }'

# Ask about cell data
curl -X POST http://localhost:3000/chat/conversations/$CONVERSATION_ID/messages \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What is the confidence score for row 1, column email?"
  }'

# Ask about citations
curl -X POST http://localhost:3000/chat/conversations/$CONVERSATION_ID/messages \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What resources were used for row 2, column company?"
  }'
```

### 6. Get Messages in Conversation

```bash
curl -X GET http://localhost:3000/chat/conversations/$CONVERSATION_ID/messages \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 7. Get Cell Details

```bash
curl -X GET http://localhost:3000/chat/websets/$WEBSET_ID/cell/1/email \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 8. Get Cell Citations

```bash
curl -X GET http://localhost:3000/chat/websets/$WEBSET_ID/cell/1/email/citations \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 9. Update Conversation Title

```bash
curl -X PATCH http://localhost:3000/chat/conversations/$CONVERSATION_ID \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated conversation title"
  }'
```

### 10. Delete Conversation

```bash
curl -X DELETE http://localhost:3000/chat/conversations/$CONVERSATION_ID \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## WebSocket Testing

### Node.js Example

Create a file `test-websocket.js`:

```javascript
const { io } = require('socket.io-client');

// Configuration
const BACKEND_URL = 'http://localhost:3000';
const USER_ID = 'your-user-id';
const CONVERSATION_ID = 'your-conversation-id';

// Connect to chat namespace
const socket = io(`${BACKEND_URL}/chat`, {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');
  
  // Authenticate
  socket.emit('authenticate', { userId: USER_ID });
  
  // Join conversation
  socket.emit('joinConversation', {
    conversationId: CONVERSATION_ID,
    userId: USER_ID,
  }, (response) => {
    console.log('Join response:', response);
  });
});

// Listen for incoming messages
socket.on('messageReceived', (data) => {
  console.log('\n📨 Message received:');
  console.log('Role:', data.message.role);
  console.log('Content:', data.message.content);
});

// Listen for typing indicator
socket.on('assistantTyping', (data) => {
  if (data.typing) {
    console.log('⌨️  Assistant is typing...');
  } else {
    console.log('✋ Assistant stopped typing');
  }
});

// Listen for stream events
socket.on('streamStart', (data) => {
  console.log('\n🌊 Stream started');
  process.stdout.write('Response: ');
});

socket.on('streamChunk', (data) => {
  process.stdout.write(data.chunk);
});

socket.on('streamEnd', (data) => {
  console.log('\n✅ Stream ended. Message ID:', data.messageId);
});

socket.on('streamError', (data) => {
  console.error('❌ Stream error:', data.error);
});

socket.on('error', (data) => {
  console.error('❌ Error:', data.error);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket');
});

// Wait for connection before sending messages
setTimeout(() => {
  console.log('\n📤 Sending message...');
  socket.emit('sendMessage', {
    conversationId: CONVERSATION_ID,
    content: 'What columns are in this webset?',
    userId: USER_ID,
  }, (response) => {
    console.log('Send response:', response);
  });
}, 2000);

// Test streaming after first message
setTimeout(() => {
  console.log('\n📤 Sending streaming message...');
  socket.emit('streamMessage', {
    conversationId: CONVERSATION_ID,
    content: 'Tell me about the data quality in this webset',
    userId: USER_ID,
  }, (response) => {
    console.log('Stream response:', response);
  });
}, 10000);

// Keep process alive
process.stdin.resume();
```

Run it:

```bash
npm install socket.io-client
node test-websocket.js
```

### Browser Example

Create an HTML file `test-websocket.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat WebSocket Test</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>Chat WebSocket Test</h1>
  
  <div>
    <label>User ID: <input type="text" id="userId" value="your-user-id"></label><br>
    <label>Conversation ID: <input type="text" id="conversationId" value="your-conversation-id"></label><br>
    <button onclick="connect()">Connect</button>
    <button onclick="disconnect()">Disconnect</button>
  </div>
  
  <div style="margin-top: 20px;">
    <label>Message: <input type="text" id="message" value="What columns are in this webset?" style="width: 300px;"></label><br>
    <button onclick="sendMessage()">Send Message</button>
    <button onclick="streamMessage()">Stream Message</button>
  </div>
  
  <div id="status" style="margin-top: 20px; padding: 10px; background: #f0f0f0;"></div>
  <div id="messages" style="margin-top: 20px; height: 400px; overflow-y: scroll; border: 1px solid #ccc; padding: 10px;"></div>

  <script>
    let socket = null;
    
    function log(message, type = 'info') {
      const colors = {
        info: '#000',
        success: '#0a0',
        error: '#a00',
        warning: '#a50',
      };
      
      const messagesDiv = document.getElementById('messages');
      const p = document.createElement('p');
      p.style.color = colors[type];
      p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
      messagesDiv.appendChild(p);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    function updateStatus(text, color = '#000') {
      const statusDiv = document.getElementById('status');
      statusDiv.textContent = text;
      statusDiv.style.color = color;
    }
    
    function connect() {
      if (socket) {
        log('Already connected', 'warning');
        return;
      }
      
      const userId = document.getElementById('userId').value;
      const conversationId = document.getElementById('conversationId').value;
      
      socket = io('http://localhost:3000/chat', {
        transports: ['websocket'],
      });
      
      socket.on('connect', () => {
        log('Connected to WebSocket', 'success');
        updateStatus('Connected', '#0a0');
        
        socket.emit('authenticate', { userId });
        
        socket.emit('joinConversation', {
          conversationId,
          userId,
        }, (response) => {
          log(`Joined conversation: ${JSON.stringify(response)}`, 'success');
        });
      });
      
      socket.on('messageReceived', (data) => {
        log(`Message (${data.message.role}): ${data.message.content}`, 'info');
      });
      
      socket.on('assistantTyping', (data) => {
        if (data.typing) {
          updateStatus('Assistant is typing...', '#00a');
        } else {
          updateStatus('Connected', '#0a0');
        }
      });
      
      socket.on('streamStart', () => {
        log('Stream started', 'success');
        updateStatus('Streaming response...', '#00a');
      });
      
      socket.on('streamChunk', (data) => {
        log(`Chunk: ${data.chunk}`, 'info');
      });
      
      socket.on('streamEnd', (data) => {
        log(`Stream ended. Message ID: ${data.messageId}`, 'success');
        updateStatus('Connected', '#0a0');
      });
      
      socket.on('error', (data) => {
        log(`Error: ${data.error}`, 'error');
        updateStatus('Error occurred', '#a00');
      });
      
      socket.on('disconnect', () => {
        log('Disconnected from WebSocket', 'warning');
        updateStatus('Disconnected', '#a00');
        socket = null;
      });
    }
    
    function disconnect() {
      if (!socket) {
        log('Not connected', 'warning');
        return;
      }
      
      socket.disconnect();
      socket = null;
    }
    
    function sendMessage() {
      if (!socket) {
        log('Not connected. Please connect first.', 'error');
        return;
      }
      
      const userId = document.getElementById('userId').value;
      const conversationId = document.getElementById('conversationId').value;
      const content = document.getElementById('message').value;
      
      log(`Sending: ${content}`, 'info');
      
      socket.emit('sendMessage', {
        conversationId,
        content,
        userId,
      }, (response) => {
        log(`Send response: ${JSON.stringify(response)}`, 'success');
      });
    }
    
    function streamMessage() {
      if (!socket) {
        log('Not connected. Please connect first.', 'error');
        return;
      }
      
      const userId = document.getElementById('userId').value;
      const conversationId = document.getElementById('conversationId').value;
      const content = document.getElementById('message').value;
      
      log(`Streaming: ${content}`, 'info');
      
      socket.emit('streamMessage', {
        conversationId,
        content,
        userId,
      }, (response) => {
        log(`Stream response: ${JSON.stringify(response)}`, 'success');
      });
    }
  </script>
</body>
</html>
```

Open in a browser and test the WebSocket functionality.

## Common Issues

### 1. "No active LLM provider found"

**Solution**: Configure at least one LLM provider and ensure it's active:

```bash
curl -X POST http://localhost:3000/llm-providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "OpenAI",
    "type": "OPENAI",
    "apiKey": "your-openai-api-key",
    "isActive": true,
    "config": {
      "defaultModel": "gpt-3.5-turbo"
    }
  }'
```

### 2. "Webset not found"

**Solution**: Create a webset first:

```bash
curl -X POST http://localhost:3000/websets \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Webset",
    "description": "Test data",
    "columnDefinitions": [
      {"id": "email", "name": "Email", "type": "text"},
      {"id": "company", "name": "Company", "type": "text"}
    ]
  }'
```

### 3. "Conversation not found"

**Solution**: Create a conversation first using the create endpoint shown above.

### 4. WebSocket connection fails

**Possible causes**:
- Backend not running
- CORS issues (check browser console)
- Wrong namespace (ensure using `/chat`)
- Firewall blocking WebSocket connections

### 5. Empty or incorrect responses

**Check**:
- LLM provider has valid API key
- Webset has data (cells populated)
- User has permission to access the webset

## Sample Conversation Flow

```bash
# 1. Create webset
WEBSET_RESPONSE=$(curl -s -X POST http://localhost:3000/websets \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Database",
    "description": "List of customers",
    "columnDefinitions": [
      {"id": "name", "name": "Name", "type": "text"},
      {"id": "email", "name": "Email", "type": "text"},
      {"id": "company", "name": "Company", "type": "text"}
    ]
  }')

WEBSET_ID=$(echo $WEBSET_RESPONSE | jq -r '.id')
echo "Created webset: $WEBSET_ID"

# 2. Add some cells
curl -X POST http://localhost:3000/websets/$WEBSET_ID/cells \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "row": 1,
    "column": "name",
    "value": "John Doe",
    "confidenceScore": 0.95
  }'

curl -X POST http://localhost:3000/websets/$WEBSET_ID/cells \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "row": 1,
    "column": "email",
    "value": "john@example.com",
    "confidenceScore": 0.98
  }'

# 3. Create conversation
CONV_RESPONSE=$(curl -s -X POST http://localhost:3000/chat/conversations \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "websetId": "'$WEBSET_ID'",
    "title": "Exploring customer data"
  }')

CONVERSATION_ID=$(echo $CONV_RESPONSE | jq -r '.id')
echo "Created conversation: $CONVERSATION_ID"

# 4. Ask questions
curl -X POST http://localhost:3000/chat/conversations/$CONVERSATION_ID/messages \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "What data do I have in this webset?"}'

curl -X POST http://localhost:3000/chat/conversations/$CONVERSATION_ID/messages \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "What is the confidence score for the email in row 1?"}'
```

## Performance Testing

For load testing WebSocket connections:

```bash
npm install -g artillery

# Create artillery config file
cat > chat-load-test.yml << 'EOF'
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
  socketio:
    transports: ["websocket"]

scenarios:
  - engine: socketio
    flow:
      - think: 1
      - emit:
          channel: "authenticate"
          data:
            userId: "test-user-{{ $randomNumber }}"
      - emit:
          channel: "joinConversation"
          data:
            conversationId: "test-conversation"
            userId: "test-user-{{ $randomNumber }}"
      - think: 2
      - emit:
          channel: "sendMessage"
          data:
            conversationId: "test-conversation"
            content: "What columns are in this webset?"
            userId: "test-user-{{ $randomNumber }}"
      - think: 5
EOF

# Run load test
artillery run chat-load-test.yml
```
