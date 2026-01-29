import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<{
    log: ({
        level: "query";
        emit: "event";
    } | {
        level: "error";
        emit: "event";
    } | {
        level: "warn";
        emit: "event";
    })[];
}, "error" | "warn" | "query", import("@prisma/client/runtime/library").DefaultArgs>;
export declare const connectDatabase: () => Promise<void>;
//# sourceMappingURL=database.d.ts.map