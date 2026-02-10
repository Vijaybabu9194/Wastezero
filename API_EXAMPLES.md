# API Testing Collection

Example requests for testing the WasteZero API using curl, Postman, or any HTTP client.

## Authentication

### Register New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "role": "user",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001"
    }
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "yourpassword"
  }'
```

Response will include a JWT token. Use it in subsequent requests.

### Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Pickups

### Create Pickup Request
```bash
curl -X POST http://localhost:5000/api/pickups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "scheduledDate": "2026-02-15",
    "scheduledTimeSlot": "morning",
    "pickupAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "coordinates": {
        "lat": 40.7128,
        "lng": -74.0060
      }
    },
    "wasteCategories": [
      {
        "type": "plastic",
        "estimatedWeight": 5,
        "description": "Plastic bottles"
      },
      {
        "type": "paper",
        "estimatedWeight": 3,
        "description": "Newspapers and cardboard"
      }
    ],
    "notes": "Please ring doorbell"
  }'
```

### Get All Pickups
```bash
curl -X GET http://localhost:5000/api/pickups \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Pickup by ID
```bash
curl -X GET http://localhost:5000/api/pickups/PICKUP_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Cancel Pickup
```bash
curl -X DELETE http://localhost:5000/api/pickups/PICKUP_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "reason": "No longer needed"
  }'
```

### Rate Pickup
```bash
curl -X POST http://localhost:5000/api/pickups/PICKUP_ID/rate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "score": 5,
    "review": "Excellent service, very professional!"
  }'
```

## Agent Operations

### Get Agent Pickups
```bash
curl -X GET http://localhost:5000/api/agents/pickups \
  -H "Authorization: Bearer AGENT_JWT_TOKEN"
```

### Update Pickup Status
```bash
curl -X PUT http://localhost:5000/api/agents/pickups/PICKUP_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer AGENT_JWT_TOKEN" \
  -d '{
    "status": "in-progress"
  }'
```

### Complete Pickup
```bash
curl -X PUT http://localhost:5000/api/agents/pickups/PICKUP_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer AGENT_JWT_TOKEN" \
  -d '{
    "status": "completed",
    "actualWeight": 8.5
  }'
```

### Update Agent Location
```bash
curl -X PUT http://localhost:5000/api/agents/location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer AGENT_JWT_TOKEN" \
  -d '{
    "lat": 40.7589,
    "lng": -73.9851
  }'
```

## Admin Operations

### Get Dashboard Statistics
```bash
curl -X GET http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Get All Users
```bash
curl -X GET "http://localhost:5000/api/admin/users?page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Get All Agents
```bash
curl -X GET http://localhost:5000/api/admin/agents \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Verify Agent
```bash
curl -X PUT http://localhost:5000/api/admin/agents/AGENT_ID/verify \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Find Available Agents
```bash
curl -X POST http://localhost:5000/api/admin/agents/find-available \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "pickupId": "PICKUP_ID"
  }'
```

### Assign Agent to Pickup
```bash
curl -X POST http://localhost:5000/api/admin/agents/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "pickupId": "PICKUP_ID",
    "agentId": "AGENT_ID"
  }'
```

## Notifications

### Get Notifications
```bash
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Unread Notifications
```bash
curl -X GET "http://localhost:5000/api/notifications?unread=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Mark Notification as Read
```bash
curl -X PUT http://localhost:5000/api/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Mark All as Read
```bash
curl -X PUT http://localhost:5000/api/notifications/read-all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Response Examples

### Successful Login Response
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65abc123...",
    "name": "Your Name",
    "email": "your@email.com",
    "role": "user",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001"
    },
    "wasteStats": {
      "totalPickups": 5,
      "totalWeight": 25.5,
      "plasticWeight": 10,
      "organicWeight": 8,
      "ewasteWeight": 2,
      "paperWeight": 4,
      "glassWeight": 1,
      "metalWeight": 0.5
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

## Testing with Postman

1. Import these requests into Postman
2. Create an environment variable for `token`
3. Set the token after login
4. Use `{{token}}` in Authorization headers

## WebSocket Testing

Connect to Socket.io for real-time updates:

```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('join-room', 'USER_ID');
});

socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```
