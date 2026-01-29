"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const jest_mock_extended_1 = require("jest-mock-extended");
// Mock Prisma Client
jest.mock('../config/prisma', () => ({
    __esModule: true,
    default: (0, jest_mock_extended_1.mockDeep)(),
}));
// Mock Redis
jest.mock('../config/redis', () => ({
    redisClient: {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        setex: jest.fn(),
    },
}));
// Mock logger to avoid console noise in tests
jest.mock('../config/logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));
// Reset mocks before each test
beforeEach(() => {
    (0, jest_mock_extended_1.mockReset)(exports.prisma);
});
exports.prisma = (0, jest_mock_extended_1.mockDeep)();
//# sourceMappingURL=setup.js.map