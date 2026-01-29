# 🚀 Quick Implementation Guide - Critical Missing Features

## Priority 1: Enable Disabled Controllers (2-3 days)

### Step 1: Re-enable Controllers

```bash
# 1. Enable Feedback Controller
mv backend/src/controllers/feedbackController.ts.disabled backend/src/controllers/feedbackController.ts

# 2. Fix VisitFeedback model imports
# The VisitFeedback model exists in schema - just need to use correct Prisma queries

# 3. Test the build
npm run build
```

### Step 2: Add OfficerLeave Model

```prisma
# Add to backend/prisma/schema.prisma after BeatOfficer model

model OfficerLeave {
  id            String      @id @default(cuid())
  officerId     String
  startDate     DateTime
  endDate       DateTime
  leaveType     String      // Annual, Sick, Emergency, Casual
  status        String      @default("Pending") // Pending, Approved, Rejected, Cancelled
  reason        String?
  approvedBy    String?
  approvedAt    DateTime?
  rejectedBy    String?
  rejectionReason String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  officer       BeatOfficer @relation("OfficerLeaves", fields: [officerId], references: [id])
  approver      User?       @relation("LeaveApprover", fields: [approvedBy], references: [id])
  
  @@index([officerId])
  @@index([status])
  @@index([startDate])
  @@index([endDate])
}

# Update BeatOfficer model - add this line
model BeatOfficer {
  # ... existing fields
  Leave         OfficerLeave[] @relation("OfficerLeaves")
}

# Update User model - add this line
model User {
  # ... existing fields
  ApprovedLeaves OfficerLeave[] @relation("LeaveApprover")
}
```

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_officer_leave
```

### Step 3: Enable Leave Controller

```bash
mv backend/src/controllers/leaveController.ts.disabled backend/src/controllers/leaveController.ts
npm run build
```

---

## Priority 2: Service Request Management (2 days)

### Create Service Request Controller

```typescript
// backend/src/controllers/serviceRequestController.ts

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const db = prisma as any;

export class ServiceRequestController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { seniorCitizenId, requestType, description, priority } = req.body;

      const serviceRequest = await db.serviceRequest.create({
        data: {
          seniorCitizenId,
          requestType, // 'HEALTH', 'EMERGENCY', 'WELFARE', 'DOCUMENT'
          description,
          priority: priority || 'Medium',
          status: 'Pending',
          requestedAt: new Date()
        },
        include: {
          SeniorCitizen: {
            select: { fullName: true, mobileNumber: true }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: serviceRequest,
        message: 'Service request created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, requestType, priority, seniorCitizenId } = req.query;
      
      const where: any = {};
      if (status) where.status = status;
      if (requestType) where.requestType = requestType;
      if (priority) where.priority = priority;
      if (seniorCitizenId) where.seniorCitizenId = seniorCitizenId;

      const requests = await db.serviceRequest.findMany({
        where,
        include: {
          SeniorCitizen: {
            select: { fullName: true, mobileNumber: true, permanentAddress: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { requestedAt: 'desc' }
        ]
      });

      res.json({
        success: true,
        data: requests,
        total: requests.length
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, assignedTo, notes } = req.body;

      const serviceRequest = await db.serviceRequest.update({
        where: { id },
        data: {
          status,
          ...(assignedTo && { assignedTo }),
          ...(notes && { notes }),
          ...(status === 'Completed' && { completedAt: new Date() })
        }
      });

      res.json({
        success: true,
        data: serviceRequest,
        message: 'Service request updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### Add Routes

```typescript
// backend/src/routes/serviceRequestRoutes.ts

import express from 'express';
import { ServiceRequestController } from '../controllers/serviceRequestController';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { Role } from '../types/auth';

const router = express.Router();

router.use(authenticate);

router.post('/', ServiceRequestController.create);
router.get('/', ServiceRequestController.list);
router.patch('/:id/status', requireRole([Role.ADMIN, Role.OFFICER]), ServiceRequestController.updateStatus);

export default router;
```

```typescript
// Add to backend/src/app.ts

import serviceRequestRoutes from './routes/serviceRequestRoutes';

// ... in app setup
app.use('/api/v1/service-requests', serviceRequestRoutes);
```

---

## Priority 3: Real-Time Notifications (3-4 days)

### Install Dependencies

```bash
npm install socket.io
npm install --save-dev @types/socket.io
```

### Create WebSocket Service

```typescript
// backend/src/services/websocketService.ts

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { TokenService } from './tokenService';
import { logger } from '../config/logger';

class WebSocketService {
  private io: Server | null = null;
  private userSockets: Map<string, string[]> = new Map();

  initialize(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        credentials: true
      }
    });

    this.io.use((socket: Socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = TokenService.verifyAccessToken(token);
        socket.data.userId = decoded.userId;
        socket.data.role = decoded.role;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      logger.info('WebSocket connected', { userId, socketId: socket.id });

      // Track user's sockets
      const userSocketIds = this.userSockets.get(userId) || [];
      userSocketIds.push(socket.id);
      this.userSockets.set(userId, userSocketIds);

      // Join user-specific room
      socket.join(`user_${userId}`);

      socket.on('disconnect', () => {
        logger.info('WebSocket disconnected', { userId, socketId: socket.id });
        const sockets = this.userSockets.get(userId) || [];
        this.userSockets.set(userId, sockets.filter(id => id !== socket.id));
      });
    });

    logger.info('WebSocket service initialized');
  }

  // Send notification to specific user
  sendToUser(userId: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(`user_${userId}`).emit(event, data);
  }

  // Send to all users with specific role
  sendToRole(role: string, event: string, data: any) {
    if (!this.io) return;
    // Implementation depends on how you want to track roles
    this.io.emit(event, { ...data, targetRole: role });
  }

  // Broadcast to all connected users
  broadcast(event: string, data: any) {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  // Send SOS alert to nearby officers
  sendSOSToNearbyOfficers(sosAlert: any, officerIds: string[]) {
    if (!this.io) return;
    officerIds.forEach(officerId => {
      this.sendToUser(officerId, 'sos:alert', sosAlert);
    });
  }

  // Send visit reminder
  sendVisitReminder(officerId: string, visit: any) {
    this.sendToUser(officerId, 'visit:reminder', visit);
  }
}

export const websocketService = new WebSocketService();
```

### Update Server.ts

```typescript
// backend/src/server.ts

import { createServer } from 'http';
import app from './app';
import { websocketService } from './services/websocketService';

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Initialize WebSocket
websocketService.initialize(httpServer);

httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ WebSocket server running`);
});
```

### Use in Controllers

```typescript
// Example: In sosController.ts

import { websocketService } from '../services/websocketService';

// When SOS alert is created
const sosAlert = await prisma.sOSAlert.create({ /* ... */ });

// Send real-time notification to nearby officers
const nearbyOfficers = await findNearbyOfficers(latitude, longitude);
websocketService.sendSOSToNearbyOfficers(sosAlert, nearbyOfficers.map(o => o.id));
```

---

## Priority 4: Enhanced Visit Scheduling (4-5 days)

### Install Dependencies

```bash
npm install geolib  # For distance calculations
```

### Create Intelligent Scheduler

```typescript
// backend/src/services/intelligentScheduler.ts

import { prisma } from '../config/database';
import { getDistance } from 'geolib';

const db = prisma as any;

export class IntelligentScheduler {
  /**
   * Suggest best officer for a citizen based on:
   * - Proximity
   * - Current workload
   * - Past performance
   */
  async suggestBestOfficer(citizenId: string): Promise<any> {
    const citizen = await db.seniorCitizen.findUnique({
      where: { id: citizenId },
      include: { Beat: true }
    });

    if (!citizen) throw new Error('Citizen not found');

    // Get all officers in the beat
    const officers = await db.beatOfficer.findMany({
      where: {
        beatId: citizen.beatId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            Visit: {
              where: {
                scheduledDate: {
                  gte: new Date(),
                  lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        }
      }
    });

    // Score each officer
    const scoredOfficers = officers.map(officer => {
      const upcomingVisits = officer._count.Visit;
      const workloadScore = Math.max(0, 100 - (upcomingVisits * 10));
      
      // TODO: Add performance score from feedback
      // TODO: Add distance score if GPS available
      
      return {
        officer,
        score: workloadScore,
        upcomingVisits
      };
    });

    // Sort by score
    scoredOfficers.sort((a, b) => b.score - a.score);

    return scoredOfficers[0]?.officer || null;
  }

  /**
   * Balance workload across officers
   */
  async balanceWorkload(policeStationId: string): Promise<void> {
    const officers = await db.beatOfficer.findMany({
      where: { policeStationId, isActive: true },
      include: {
        _count: {
          select: {
            Visit: {
              where: {
                status: { in: ['Scheduled', 'In Progress'] }
              }
            }
          }
        }
      }
    });

    const avgWorkload = officers.reduce((sum: number, o: any) => sum + o._count.Visit, 0) / officers.length;

    // Identify overloaded and underloaded officers
    const overloaded = officers.filter((o: any) => o._count.Visit > avgWorkload * 1.5);
    const underloaded = officers.filter((o: any) => o._count.Visit < avgWorkload * 0.5);

    // TODO: Implement reassignment logic
    console.log('Workload analysis:', { overloaded: overloaded.length, underloaded: underloaded.length });
  }

  /**
   * Optimize route for an officer's visits on a given day
   */
  async optimizeRoute(officerId: string, date: Date): Promise<any[]> {
    const visits = await db.visit.findMany({
      where: {
        officerId,
        scheduledDate: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lte: new Date(date.setHours(23, 59, 59, 999))
        }
      },
      include: {
        SeniorCitizen: {
          select: {
            id: true,
            fullName: true,
            gpsLatitude: true,
            gpsLongitude: true,
            permanentAddress: true
          }
        }
      }
    });

    // If no GPS coordinates, return as-is
    if (!visits.some(v => v.SeniorCitizen.gpsLatitude)) {
      return visits;
    }

    // Simple nearest-neighbor algorithm for route optimization
    const optimized = [];
    let current = visits[0];
    const remaining = [...visits.slice(1)];

    optimized.push(current);

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let minDistance = Infinity;

      remaining.forEach((visit, index) => {
        if (current.SeniorCitizen.gpsLatitude && visit.SeniorCitizen.gpsLatitude) {
          const distance = getDistance(
            { lat: current.SeniorCitizen.gpsLatitude, lon: current.SeniorCitizen.gpsLongitude! },
            { lat: visit.SeniorCitizen.gpsLatitude, lon: visit.SeniorCitizen.gpsLongitude! }
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestIndex = index;
          }
        }
      });

      current = remaining[nearestIndex];
      optimized.push(current);
      remaining.splice(nearestIndex, 1);
    }

    return optimized;
  }
}

export const intelligentScheduler = new IntelligentScheduler();
```

---

## Priority 5: Auto-Vulnerability Assessment (3 days)

### Enhance Vulnerability Service

```typescript
// backend/src/services/advancedVulnerabilityService.ts

import { prisma } from '../config/database';

const db = prisma as any;

export class AdvancedVulnerabilityService {
  /**
   * Auto-calculate vulnerability score based on multiple factors
   */
  async autoCalculateScore(citizenId: string): Promise<number> {
    const citizen = await db.seniorCitizen.findUnique({
      where: { id: citizenId },
      include: {
        HealthCondition: true,
        EmergencyContact: true,
        HouseholdHelp: true,
        Visit: {
          where: {
            status: 'Completed',
            completedDate: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
            }
          }
        },
        SOSAlert: true
      }
    });

    if (!citizen) throw new Error('Citizen not found');

    let score = 0;

    // Age factor (max 20 points)
    if (citizen.age >= 90) score += 20;
    else if (citizen.age >= 80) score += 15;
    else if (citizen.age >= 70) score += 10;
    else score += 5;

    // Living arrangement (max 20 points)
    if (citizen.livingArrangement === 'Alone') score += 20;
    else if (citizen.livingArrangement === 'With Spouse') score += 10;
    else score += 5;

    // Health conditions (max 25 points)
    const healthConditions = citizen.HealthCondition?.length || 0;
    score += Math.min(25, healthConditions * 5);

    // Emergency contacts (max 10 points - inverse)
    const emergencyContacts = citizen.EmergencyContact?.length || 0;
    if (emergencyContacts === 0) score += 10;
    else if (emergencyContacts === 1) score += 5;

    // Household help (max 10 points - inverse)
    const householdHelp = citizen.HouseholdHelp?.length || 0;
    if (householdHelp === 0) score += 10;
    else if (householdHelp === 1) score += 5;

    // Visit frequency (max 10 points)
    const recentVisits = citizen.Visit?.length || 0;
    if (recentVisits === 0) score += 10;
    else if (recentVisits < 2) score += 5;

    // SOS history (max 5 points)
    const sosAlerts = citizen.SOSAlert?.length || 0;
    if (sosAlerts > 0) score += 5;

    // Normalize to 100
    const finalScore = Math.min(100, score);

    // Update citizen record
    await db.seniorCitizen.update({
      where: { id: citizenId },
      data: {
        vulnerabilityScore: finalScore,
        vulnerabilityLevel: finalScore >= 70 ? 'High' : finalScore >= 40 ? 'Medium' : 'Low'
      }
    });

    return finalScore;
  }

  /**
   * Schedule automatic reassessment for all citizens
   */
  async scheduleReassessment(): Promise<void> {
    const citizens = await db.seniorCitizen.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    // Reassess in batches
    for (const citizen of citizens) {
      try {
        await this.autoCalculateScore(citizen.id);
      } catch (error) {
        console.error(`Failed to reassess citizen ${citizen.id}:`, error);
      }
    }
  }
}

export const advancedVulnerabilityService = new AdvancedVulnerabilityService();
```

---

## Testing Checklist

After implementing each feature:

### Feedback System
- [ ] Create feedback via API
- [ ] Retrieve feedback for visit
- [ ] Get officer ratings
- [ ] Test feedback analytics

### Leave Management
- [ ] Create leave request
- [ ] Approve/reject leave
- [ ] Check leave conflicts with visits
- [ ] View leave calendar

### Service Requests
- [ ] Submit service request
- [ ] Update request status
- [ ] Assign to officer
- [ ] Track SLA

### WebSocket
- [ ] Connect via Socket.IO client
- [ ] Receive real-time notifications
- [ ] Test SOS alerts
- [ ] Test visit reminders

### Intelligent Scheduling
- [ ] Get officer suggestion
- [ ] Test workload balancing
- [ ] Test route optimization

### Auto-Vulnerability
- [ ] Calculate score for citizen
- [ ] Verify score accuracy
- [ ] Test batch reassessment

---

## Deployment Steps

1. **Update Schema**
   ```bash
   npx prisma migrate dev --name add_missing_features
   npx prisma generate
   ```

2. **Build & Test**
   ```bash
   npm run build
   npm test
   ```

3. **Deploy**
   ```bash
   # Your deployment process
   ```

---

**Estimated Total Time:** 2-3 weeks for all Priority 1-3 features
**ROI:** High - Completescore MVP to full production system
