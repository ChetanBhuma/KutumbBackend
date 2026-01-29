import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { TokenService } from './tokenService';
import { logger } from '../config/logger';

class WebSocketService {
    private io: Server | null = null;
    private userSockets: Map<string, string[]> = new Map();
    private socketUsers: Map<string, { userId: string; role: string }> = new Map();

    initialize(httpServer: HTTPServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || '*',
                credentials: true
            },
            path: '/socket.io/'
        });

        // Authentication middleware
        this.io.use((socket: Socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

                if (!token) {
                    return next(new Error('Authentication error: No token provided'));
                }

                const decoded = TokenService.verifyAccessToken(token);
                socket.data.userId = decoded.userId;
                socket.data.role = decoded.role;
                socket.data.email = decoded.email;

                next();
            } catch (error: any) {
                logger.error('WebSocket authentication failed', { error: error.message });
                next(new Error('Authentication error: Invalid token'));
            }
        });

        // Connection handler
        this.io.on('connection', (socket: Socket) => {
            const userId = socket.data.userId;
            const role = socket.data.role;

            logger.info('WebSocket connected', {
                userId,
                role,
                socketId: socket.id,
                email: socket.data.email
            });

            // Track user's sockets
            const userSocketIds = this.userSockets.get(userId) || [];
            userSocketIds.push(socket.id);
            this.userSockets.set(userId, userSocketIds);
            this.socketUsers.set(socket.id, { userId, role });

            // Join user-specific room
            socket.join(`user_${userId}`);

            // Join role-specific room
            socket.join(`role_${role}`);

            // Send connection confirmation
            socket.emit('connected', {
                success: true,
                userId,
                role,
                timestamp: new Date().toISOString()
            });

            // Handle custom events
            socket.on('join_room', (room: string) => {
                socket.join(room);
                logger.info('User joined room', { userId, room });
            });

            socket.on('leave_room', (room: string) => {
                socket.leave(room);
                logger.info('User left room', { userId, room });
            });

            // Disconnect handler
            socket.on('disconnect', () => {
                logger.info('WebSocket disconnected', { userId, socketId: socket.id });

                const sockets = this.userSockets.get(userId) || [];
                this.userSockets.set(userId, sockets.filter(id => id !== socket.id));
                this.socketUsers.delete(socket.id);

                // Clean up if no more sockets for this user
                if (this.userSockets.get(userId)?.length === 0) {
                    this.userSockets.delete(userId);
                }
            });

            socket.on('error', (error: Error) => {
                logger.error('WebSocket error', { userId, error: error.message });
            });
        });

        logger.info('✅ WebSocket service initialized');
        return this.io;
    }

    /**
     * Send notification to specific user
     */
    sendToUser(userId: string, event: string, data: any) {
        if (!this.io) {
            logger.warn('WebSocket not initialized');
            return;
        }

        this.io.to(`user_${userId}`).emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });

        logger.debug('Sent to user', { userId, event });
    }

    /**
     * Send to all users with specific role
     */
    sendToRole(role: string, event: string, data: any) {
        if (!this.io) {
            logger.warn('WebSocket not initialized');
            return;
        }

        this.io.to(`role_${role}`).emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });

        logger.debug('Sent to role', { role, event });
    }

    /**
     * Broadcast to all connected users
     */
    broadcast(event: string, data: any) {
        if (!this.io) {
            logger.warn('WebSocket not initialized');
            return;
        }

        this.io.emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });

        logger.debug('Broadcast sent', { event });
    }

    /**
     * Send SOS alert to nearby officers
     */
    sendSOSToNearbyOfficers(sosAlert: any, officerIds: string[]) {
        if (!this.io) return;

        officerIds.forEach(officerId => {
            this.sendToUser(officerId, 'sos:alert', {
                type: 'SOS_ALERT',
                alert: sosAlert,
                priority: 'HIGH'
            });
        });

        logger.info('SOS alert sent to officers', {
            sosId: sosAlert.id,
            officerCount: officerIds.length
        });
    }

    /**
     * Send visit reminder to officer
     */
    sendVisitReminder(officerId: string, visit: any) {
        this.sendToUser(officerId, 'visit:reminder', {
            type: 'VISIT_REMINDER',
            visit
        });

        logger.info('Visit reminder sent', { officerId, visitId: visit.id });
    }

    /**
     * Send notification about verification status
     */
    sendVerificationUpdate(citizenId: string, verification: any) {
        this.sendToUser(citizenId, 'verification:update', {
            type: 'VERIFICATION_UPDATE',
            verification
        });

        logger.info('Verification update sent', { citizenId });
    }

    /**
     * Send general notification
     */
    sendNotification(userId: string, notification: any) {
        this.sendToUser(userId, 'notification', {
            type: 'NOTIFICATION',
            ...notification
        });
    }

    /**
     * Get connected users count
     */
    getConnectedUsersCount(): number {
        if (!this.io) return 0;
        return this.io.sockets.sockets.size;
    }

    /**
     * Check if user is online
     */
    isUserOnline(userId: string): boolean {
        const sockets = this.userSockets.get(userId);
        return sockets !== undefined && sockets.length > 0;
    }

    /**
     * Get all connected user IDs
     */
    getConnectedUserIds(): string[] {
        return Array.from(this.userSockets.keys());
    }

    /**
     * Send to specific room
     */
    sendToRoom(room: string, event: string, data: any) {
        if (!this.io) return;

        this.io.to(room).emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }
}

export const websocketService = new WebSocketService();
export default websocketService;
