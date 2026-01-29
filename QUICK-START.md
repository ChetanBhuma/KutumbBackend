# 🚀 Quick Start Guide - New Features

## 1. Database Migration

First, apply the new schema changes:

```bash
cd backend
npx prisma migrate dev --name add_critical_features
```

This creates the `OfficerLeave` table and updates relations.

---

## 2. Start the Server

```bash
npm run dev
```

You should see:
```
✅ WebSocket service initialized
🚀 Server running on port 5000 in development mode
🔌 WebSocket server running on port 5000
```

---

## 3. Quick API Tests

### Test Service Requests

```bash
# Get authentication token first (use your existing login)
TOKEN="your_jwt_token_here"

# Create a service request
curl -X POST http://localhost:5000/api/v1/service-requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "seniorCitizenId": "existing_citizen_id",
    "requestType": "HEALTH",
    "description": "Need medical checkup",
    "priority": "Medium"
  }'

# List all requests
curl -X GET http://localhost:5000/api/v1/service-requests \
  -H "Authorization: Bearer $TOKEN"

# Get statistics
curl -X GET http://localhost:5000/api/v1/service-requests/stats \
  -H "Authorization: Bearer $TOKEN"
```

### Test Feedback System

```bash
# Submit feedback (replace visitId with actual completed visit)
curl -X POST http://localhost:5000/api/v1/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "visitId": "completed_visit_id",
    "rating": 5,
    "comments": "Excellent service"
  }'

# Get officer ratings
curl -X GET http://localhost:5000/api/v1/feedback/officer/{officerId}/metrics \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4. Test WebSocket Connection

### Using Browser Console

```javascript
// Open browser console on your frontend
const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') },
  path: '/socket.io/'
});

socket.on('connected', (data) => console.log('Connected:', data));
socket.on('notification', (data) => console.log('Notification:', data));
socket.on('sos:alert', (data) => console.log('SOS Alert:', data));
```

### Using Node.js

```javascript
// test-websocket.js
const io = require('socket.io-client');

const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_TOKEN' },
  path: '/socket.io/'
});

socket.on('connected', (data) => {
  console.log('✅ WebSocket Connected:', data);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});
```

Run: `node test-websocket.js`

---

## 5. Frontend Integration

### Add to your React/Next.js app

```bash
npm install socket.io-client
```

```typescript
// lib/websocket.ts
import io, { Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectWebSocket = (token: string) => {
  if (socket?.connected) return socket;

  socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
    auth: { token },
    path: '/socket.io/'
  });

  socket.on('connected', (data) => {
    console.log('WebSocket connected:', data);
  });

  socket.on('notification', (notification) => {
    // Show toast notification
    showNotification(notification);
  });

  socket.on('sos:alert', (alert) => {
    // Show emergency alert
    showEmergencyAlert(alert);
  });

  socket.on('visit:reminder', (visit) => {
    // Show visit reminder
    showVisitReminder(visit);
  });

  return socket;
};

export const disconnectWebSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => socket;
```

```typescript
// In your component or layout
import { useEffect } from 'react';
import { connectWebSocket } from '@/lib/websocket';

export default function Layout({ children }) {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      connectWebSocket(token);
    }

    return () => disconnectWebSocket();
  }, []);

  return <>{children}</>;
}
```

---

## 6. Check Implementation Status

```bash
# View all documentation
ls -lh *.md

# Files created:
# - IMPLEMENTATION-COMPLETE.md (full implementation guide)
# - BUSINESS-LOGIC-ANALYSIS.md (gap analysis)
# - IMPLEMENTATION-GUIDE.md (code examples)
# - ANALYSIS-SUMMARY.md (executive summary)
# - BUILD-SUCCESS.md (build fixes)
# - QUICK-REFERENCE.md (cheat sheet)
```

---

## 7. Common Issues & Solutions

### Issue: WebSocket not connecting

**Solution:**
```bash
# Check if server is running
curl http://localhost:5000/health

# Check server logs for WebSocket initialization
# You should see: "✅ WebSocket service initialized"
```

### Issue: Service request model not found

**Solution:**
```bash
# Run migration
npx prisma migrate dev

# Regenerate client
npx prisma generate
```

### Issue: Feedback controller errors

**Solution:**
```bash
# Rebuild the project
npm run build

# Check for any TypeScript errors
```

---

## 8. Production Deployment

### Before deploying:

1. **Run tests** (when implemented)
   ```bash
   npm test
   ```

2. **Build production bundle**
   ```bash
   npm run build
   ```

3. **Set environment variables**
   ```bash
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-url.com
   DATABASE_URL=your_production_database_url
   ```

4. **Run migrations on production**
   ```bash
   npx prisma migrate deploy
   ```

5. **Start server**
   ```bash
   npm start
   ```

---

## 9. Monitoring

### Check WebSocket connections

```typescript
// Add to your admin dashboard API
app.get('/api/v1/admin/websocket/stats', authenticate, async (req, res) => {
  const stats = {
    connected: websocketService.getConnectedUsersCount(),
    userIds: websocketService.getConnectedUserIds()
  };
  res.json({ success: true, data: stats });
});
```

### Monitor Service Requests

```bash
# Get real-time stats
curl -X GET http://localhost:5000/api/v1/service-requests/stats \
  -H "Authorization: Bearer $TOKEN"
```

---

## 10. Next Development Steps

### This Week:
- [ ] Test all endpoints with Postman
- [ ] Fix Leave Controller
- [ ] Create API documentation (Swagger)
- [ ] Add unit tests for new features

### Next Week:
- [ ] Implement intelligent scheduling
- [ ] Add email notifications
- [ ] Create admin dashboard for service requests
- [ ] Add WebSocket event history

---

## 📞 Support

If you encounter issues:

1. Check server logs
2. Review `IMPLEMENTATION-COMPLETE.md` for detailed docs
3. Test with curl commands provided above
4. Verify database migration completed

---

**Quick Links:**
- Full Implementation Guide: `IMPLEMENTATION-COMPLETE.md`
- Testing Checklist: `IMPLEMENTATION-GUIDE.md`
- Business Analysis: `BUSINESS-LOGIC-ANALYSIS.md`

**Status:** ✅ Ready for testing
**Build:** ✅ Passing
**Features:** 3/5 critical features complete
