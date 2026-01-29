// Example: Authentication Controller Tests
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { login, register } from '../../controllers/authController';
import { prisma } from '../setup';

const app = express();
app.use(express.json());
app.post('/login', login);
app.post('/register', register);

describe('Auth Controller', () => {
    describe('POST /login', () => {
        it('should login successfully with valid credentials', async () => {
            // Mock user data
            const mockUser = {
                id: 'user_123',
                email: 'test@example.com',
                password: await bcrypt.hash('password123', 10),
                role: 'OFFICER',
                fullName: 'Test User',
            };

            // Mock Prisma findUnique
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
            expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
        });

        it('should return 401 for invalid credentials', async () => {
            // Mock user not found
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post('/login')
                .send({
                    email: 'wrong@example.com',
                    password: 'wrongpassword',
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 for missing fields', async () => {
            const response = await request(app)
                .post('/login')
                .send({
                    email: 'test@example.com',
                    // Missing password
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /register', () => {
        it('should register a new user successfully', async () => {
            const newUser = {
                email: 'newuser@example.com',
                password: 'password123',
                fullName: 'New User',
                role: 'CITIZEN',
            };

            // Mock Prisma create
            (prisma.user.create as jest.Mock).mockResolvedValue({
                id: 'user_456',
                ...newUser,
                password: await bcrypt.hash(newUser.password, 10),
            });

            const response = await request(app)
                .post('/register')
                .send(newUser);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toHaveProperty('email', newUser.email);
        });

        it('should return 400 for duplicate email', async () => {
            // Mock Prisma error for duplicate key
            (prisma.user.create as jest.Mock).mockRejectedValue({
                code: 'P2002',
                meta: { target: ['email'] },
            });

            const response = await request(app)
                .post('/register')
                .send({
                    email: 'existing@example.com',
                    password: 'password123',
                    fullName: 'Test User',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
