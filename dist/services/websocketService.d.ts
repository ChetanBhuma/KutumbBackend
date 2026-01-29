import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
declare class WebSocketService {
    private io;
    private userSockets;
    private socketUsers;
    initialize(httpServer: HTTPServer): Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
    /**
     * Send notification to specific user
     */
    sendToUser(userId: string, event: string, data: any): void;
    /**
     * Send to all users with specific role
     */
    sendToRole(role: string, event: string, data: any): void;
    /**
     * Broadcast to all connected users
     */
    broadcast(event: string, data: any): void;
    /**
     * Send SOS alert to nearby officers
     */
    sendSOSToNearbyOfficers(sosAlert: any, officerIds: string[]): void;
    /**
     * Send visit reminder to officer
     */
    sendVisitReminder(officerId: string, visit: any): void;
    /**
     * Send notification about verification status
     */
    sendVerificationUpdate(citizenId: string, verification: any): void;
    /**
     * Send general notification
     */
    sendNotification(userId: string, notification: any): void;
    /**
     * Get connected users count
     */
    getConnectedUsersCount(): number;
    /**
     * Check if user is online
     */
    isUserOnline(userId: string): boolean;
    /**
     * Get all connected user IDs
     */
    getConnectedUserIds(): string[];
    /**
     * Send to specific room
     */
    sendToRoom(room: string, event: string, data: any): void;
}
export declare const websocketService: WebSocketService;
export default websocketService;
//# sourceMappingURL=websocketService.d.ts.map