// Test setup file
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Mock Prisma Client
jest.mock('../config/prisma', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
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
    mockReset(prisma);
});

export const prisma = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;
