export declare class OfficerAssignmentService {
    /**
     * Assigns a beat officer to a senior citizen based on their location (beat).
     * FIX: Now includes workload balancing to distribute assignments evenly.
     */
    static assignOfficerToCitizen(_citizenId: string, beatId?: string | null, policeStationId?: string): Promise<string | null>;
    /**
     * Determines the correct beat for a citizen based on location.
     * (Placeholder for future geospatial logic)
     */
    static determineBeat(_latitude: number, _longitude: number): Promise<string | null>;
}
//# sourceMappingURL=officerAssignmentService.d.ts.map