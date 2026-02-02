/**
 * Swagger/OpenAPI Documentation Configuration
 * Access at: http://localhost:5000/api-docs
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Senior Citizen Portal API',
            version: '1.0.0',
            description: 'Delhi Police Senior Citizen Care Portal - Kutumb Portal API Documentation',
            contact: {
                name: 'Delhi Police',
                email: 'support@delhipolice.gov.in',
            },
            license: {
                name: 'Proprietary',
                url: 'https://delhipolice.gov.in',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000/api/v1',
                description: 'Development Server',
            },
            {
                url: 'https://api.seniorcare.delhipolice.gov.in/api/v1',
                description: 'Production Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token',
                },
                apiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                    description: 'API Key for external integrations',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        message: {
                            type: 'string',
                            example: 'Error message',
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                            },
                        },
                    },
                },
                Citizen: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: 'citizen_123',
                        },
                        fullName: {
                            type: 'string',
                            example: 'Rajesh Kumar',
                        },
                        age: {
                            type: 'integer',
                            example: 68,
                        },
                        gender: {
                            type: 'string',
                            enum: ['Male', 'Female', 'Other'],
                            example: 'Male',
                        },
                        mobileNumber: {
                            type: 'string',
                            example: '+919876543210',
                        },
                        vulnerabilityLevel: {
                            type: 'string',
                            enum: ['Low', 'Medium', 'High'],
                            example: 'Medium',
                        },
                        idVerificationStatus: {
                            type: 'string',
                            enum: ['Pending', 'Approved', 'Rejected'],
                            example: 'Approved',
                        },
                    },
                },
                Visit: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: 'visit_123',
                        },
                        citizenId: {
                            type: 'string',
                            example: 'citizen_123',
                        },
                        officerId: {
                            type: 'string',
                            example: 'officer_456',
                        },
                        visitType: {
                            type: 'string',
                            enum: ['Routine', 'Emergency', 'Follow-up'],
                            example: 'Routine',
                        },
                        scheduledFor: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-15T10:00:00Z',
                        },
                        status: {
                            type: 'string',
                            enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
                            example: 'Scheduled',
                        },
                    },
                },
                SOSAlert: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: 'sos_123',
                        },
                        citizenId: {
                            type: 'string',
                            example: 'citizen_123',
                        },
                        latitude: {
                            type: 'number',
                            example: 28.6139,
                        },
                        longitude: {
                            type: 'number',
                            example: 77.2090,
                        },
                        status: {
                            type: 'string',
                            enum: ['Active', 'Responded', 'Resolved', 'False Alarm'],
                            example: 'Active',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-15T14:30:00Z',
                        },
                    },
                },
                Role: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'role_123' },
                        code: { type: 'string', example: 'ADMIN' },
                        name: { type: 'string', example: 'Administrator' },
                        description: { type: 'string' },
                        permissions: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['citizens.read', 'citizens.write']
                        },
                        isActive: { type: 'boolean', example: true },
                        userCount: { type: 'integer', example: 12 },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'user_123' },
                        email: { type: 'string', example: 'admin@delhipolice.gov.in' },
                        phone: { type: 'string', example: '+919811111111' },
                        role: { type: 'string', example: 'ADMIN' },
                        isActive: { type: 'boolean', example: true },
                        lastLogin: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' },
                        citizenProfile: {
                            $ref: '#/components/schemas/Citizen'
                        }
                    }
                },
                AuditLog: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'audit_123' },
                        action: { type: 'string', example: 'USER_LOGIN' },
                        performedBy: { type: 'string', example: 'user_123' },
                        targetId: { type: 'string', example: 'citizen_456' },
                        details: { type: 'object' },
                        ipAddress: { type: 'string', example: '192.168.1.1' },
                        userAgent: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                BulkImportResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        jobId: { type: 'string', example: 'job_123' },
                        message: { type: 'string', example: 'Import job started' },
                        importSummary: {
                            type: 'object',
                            properties: {
                                totalProcessed: { type: 'integer' },
                                successCount: { type: 'integer' },
                                failureCount: { type: 'integer' },
                                errors: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            row: { type: 'integer' },
                                            error: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            { name: 'Authentication', description: 'User authentication and authorization' },
            { name: 'Citizens', description: 'Senior citizen management' },
            { name: 'Officers', description: 'Police officer management' },
            { name: 'Visits', description: 'Visit scheduling and tracking' },
            { name: 'SOS', description: 'Emergency SOS alerts' },
            { name: 'Beats', description: 'Beat area management' },
            { name: 'Bulk Operations', description: 'Bulk data processing' },
            { name: 'System', description: 'System configuration and logs' },
            { name: 'Reports', description: 'Analytics and reporting' },
            { name: 'Notifications', description: 'Notification management' },
            { name: 'Roles', description: 'Role definitions and permissions' },
            { name: 'Users', description: 'User directory and role assignment' },
            { name: 'Master Data', description: 'Master data management (Districts, Police Stations, etc.)' },
        ],
        paths: {
            '/bulk/import-citizens': {
                post: {
                    tags: ['Bulk Operations'],
                    summary: 'Bulk import citizens from CSV',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        file: {
                                            type: 'string',
                                            format: 'binary'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Import processed',
                            content: { 'application/json': { schema: { $ref: '#/components/schemas/BulkImportResponse' } } }
                        }
                    }
                }
            },
            '/bulk/import-citizens-async': {
                post: {
                    tags: ['Bulk Operations'],
                    summary: 'Async bulk import citizens (for large files)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        file: { type: 'string', format: 'binary' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        202: {
                            description: 'Import job accepted',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            message: { type: 'string' },
                                            jobId: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/bulk/import-status/{jobId}': {
                get: {
                    tags: ['Bulk Operations'],
                    summary: 'Check async import job status',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'jobId', in: 'path', required: true, schema: { type: 'string' } }
                    ],
                    responses: {
                        200: {
                            description: 'Job status',
                            content: { 'application/json': { schema: { $ref: '#/components/schemas/BulkImportResponse' } } }
                        }
                    }
                }
            },
            '/system/audit-logs': {
                get: {
                    tags: ['System'],
                    summary: 'List audit logs',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
                        { name: 'action', in: 'query', schema: { type: 'string' } },
                        { name: 'userId', in: 'query', schema: { type: 'string' } },
                        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
                        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
                    ],
                    responses: {
                        200: {
                            description: 'List of audit logs',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } },
                                            pagination: {
                                                type: 'object',
                                                properties: {
                                                    total: { type: 'integer' },
                                                    pages: { type: 'integer' },
                                                    current: { type: 'integer' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/vulnerability/config': {
                get: {
                    tags: ['System'],
                    summary: 'Get active vulnerability configuration',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Active configuration',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    config: {
                                                        type: 'object',
                                                        properties: {
                                                            weights: { type: 'object' },
                                                            bands: { type: 'array', items: { type: 'object' } },
                                                            version: { type: 'integer' }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                post: {
                    tags: ['System'],
                    summary: 'Update vulnerability configuration',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        weights: { type: 'object' },
                                        bands: { type: 'array', items: { type: 'object' } },
                                        notes: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Configuration updated',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            message: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/vulnerability/preview': {
                post: {
                    tags: ['System'],
                    summary: 'Preview impact of configuration changes',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        weights: { type: 'object' },
                                        bands: { type: 'array', items: { type: 'object' } }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Impact analysis',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    impact: { type: 'object' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/roles': {
                get: {
                    tags: ['Roles'],
                    summary: 'List roles',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'List of roles',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            data: {
                                                type: 'array',
                                                items: { $ref: '#/components/schemas/Role' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                post: {
                    tags: ['Roles'],
                    summary: 'Create role',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Role' }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Role created',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Role' }
                                }
                            }
                        }
                    }
                }
            },
            '/roles/{id}': {
                put: {
                    tags: ['Roles'],
                    summary: 'Update role',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Role' }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Role updated',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Role' }
                                }
                            }
                        }
                    }
                },
                delete: {
                    tags: ['Roles'],
                    summary: 'Delete role',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                    ],
                    responses: {
                        200: {
                            description: 'Role deleted',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            message: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/users': {
                get: {
                    tags: ['Users'],
                    summary: 'List users',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'List of users',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    users: {
                                                        type: 'array',
                                                        items: { $ref: '#/components/schemas/User' }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                post: {
                    tags: ['Users'],
                    summary: 'Create user',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        email: { type: 'string' },
                                        phone: { type: 'string' },
                                        password: { type: 'string' },
                                        roleCode: { type: 'string' }
                                    },
                                    required: ['email', 'phone', 'roleCode']
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'User created',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/User' }
                                }
                            }
                        }
                    }
                }
            },
            '/users/{id}/role': {
                put: {
                    tags: ['Users'],
                    summary: 'Assign role to user',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        roleCode: { type: 'string' }
                                    },
                                    required: ['roleCode']
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Role updated',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/User' }
                                }
                            }
                        }
                    }
                }
            },
            '/users/{id}': {
                patch: {
                    tags: ['Users'],
                    summary: 'Update user status',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        isActive: { type: 'boolean' }
                                    },
                                    required: ['isActive']
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'User status updated',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/User' }
                                }
                            }
                        }
                    }
                }
            },
            // ========== AUTHENTICATION ==========
            '/auth/register': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Register a new user',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'phone', 'password'],
                                    properties: {
                                        email: { type: 'string', example: 'user@example.com' },
                                        phone: { type: 'string', example: '+919876543210' },
                                        password: { type: 'string', example: 'SecurePass123' },
                                        role: { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN', 'OFFICER', 'CITIZEN', 'VIEWER'] }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'User registered successfully' },
                        400: { description: 'Validation error' }
                    }
                }
            },
            '/auth/login': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Login with email/phone and password',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['identifier', 'password'],
                                    properties: {
                                        identifier: { type: 'string', description: 'Email or phone number' },
                                        password: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Login successful', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } },
                        401: { description: 'Invalid credentials' }
                    }
                }
            },
            '/auth/otp/send': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Send OTP to phone/email',
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['identifier'], properties: { identifier: { type: 'string' } } } } } },
                    responses: { 200: { description: 'OTP sent successfully' } }
                }
            },
            '/auth/otp/verify': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Verify OTP and login',
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['identifier', 'otp'], properties: { identifier: { type: 'string' }, otp: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Login successful' }, 401: { description: 'Invalid OTP' } }
                }
            },
            '/auth/refresh-token': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Refresh access token',
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } } } },
                    responses: { 200: { description: 'New access token generated' } }
                }
            },
            '/auth/forgot-password': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Request password reset',
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Password reset email sent' } }
                }
            },
            '/auth/reset-password': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Reset password with token',
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['token', 'password'], properties: { token: { type: 'string' }, password: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Password reset successful' } }
                }
            },
            '/auth/logout': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Logout user',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'Logout successful' } }
                }
            },
            '/auth/me': {
                get: {
                    tags: ['Authentication'],
                    summary: 'Get current user profile',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'Current user profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } } }
                }
            },
            // ========== CITIZENS ==========
            '/citizens': {
                get: {
                    tags: ['Citizens'],
                    summary: 'Get all citizens with pagination and filters',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
                        { name: 'search', in: 'query', schema: { type: 'string' } },
                        { name: 'policeStationId', in: 'query', schema: { type: 'string' } },
                        { name: 'beatId', in: 'query', schema: { type: 'string' } },
                        { name: 'vulnerabilityLevel', in: 'query', schema: { type: 'string', enum: ['Low', 'Medium', 'High'] } },
                        { name: 'verificationStatus', in: 'query', schema: { type: 'string', enum: ['Pending', 'Verified', 'Rejected'] } }
                    ],
                    responses: { 200: { description: 'List of citizens' } }
                },
                post: {
                    tags: ['Citizens'],
                    summary: 'Create new citizen',
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Citizen' } } } },
                    responses: { 201: { description: 'Citizen created' } }
                }
            },
            '/citizens/map': {
                get: {
                    tags: ['Citizens'],
                    summary: 'Get citizens for map view',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'policeStationId', in: 'query', schema: { type: 'string' } },
                        { name: 'beatId', in: 'query', schema: { type: 'string' } },
                        { name: 'districtId', in: 'query', schema: { type: 'string' } }
                    ],
                    responses: { 200: { description: 'List of citizens for map' } }
                }
            },
            '/citizens/statistics': {
                get: {
                    tags: ['Citizens'],
                    summary: 'Get citizen statistics',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'Citizen statistics' } }
                }
            },
            '/citizens/check-duplicates': {
                post: {
                    tags: ['Citizens'],
                    summary: 'Check for duplicate citizens',
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['fullName', 'mobileNumber'], properties: { fullName: { type: 'string' }, mobileNumber: { type: 'string' }, aadhaarNumber: { type: 'string' }, dateOfBirth: { type: 'string', format: 'date' } } } } } },
                    responses: { 200: { description: 'Duplicates check result' } }
                }
            },
            '/citizens/duplicates/all': {
                get: {
                    tags: ['Citizens'],
                    summary: 'Find all potential duplicates',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'List of potential duplicates' } }
                }
            },
            '/citizens/{id}': {
                get: {
                    tags: ['Citizens'],
                    summary: 'Get citizen by ID',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Citizen details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Citizen' } } } } }
                },
                put: {
                    tags: ['Citizens'],
                    summary: 'Update citizen',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Citizen' } } } },
                    responses: { 200: { description: 'Citizen updated' } }
                },
                delete: {
                    tags: ['Citizens'],
                    summary: 'Delete citizen',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Citizen deleted' } }
                }
            },
            '/citizens/{id}/verification': {
                patch: {
                    tags: ['Citizens'],
                    summary: 'Update verification status',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['Pending', 'Approved', 'Rejected'] }, remarks: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Status updated' } }
                }
            },
            '/citizens/{id}/digital-card': {
                post: {
                    tags: ['Citizens'],
                    summary: 'Issue digital card',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Digital card issued' } }
                }
            },
            '/citizens/{id}/documents': {
                get: {
                    tags: ['Citizens'],
                    summary: 'Get citizen documents',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'List of documents' } }
                },
                post: {
                    tags: ['Citizens'],
                    summary: 'Upload citizen document',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, documentType: { type: 'string', enum: ['ProfilePhoto', 'AddressProof', 'IdentityProof', 'MedicalDocument', 'Other'] } } } } } },
                    responses: { 200: { description: 'Document uploaded' } }
                }
            },
            '/citizens/{id}/documents/{docId}': {
                delete: {
                    tags: ['Citizens'],
                    summary: 'Delete citizen document',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                        { name: 'docId', in: 'path', required: true, schema: { type: 'string' } }
                    ],
                    responses: { 200: { description: 'Document deleted' } }
                }
            },
            // ========== OFFICERS ==========
            '/officers': {
                get: {
                    tags: ['Officers'],
                    summary: 'Get all officers',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
                    ],
                    responses: { 200: { description: 'List of officers' } }
                },
                post: {
                    tags: ['Officers'],
                    summary: 'Create new officer',
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'rank', 'badgeNumber', 'mobileNumber', 'policeStationId'], properties: { name: { type: 'string' }, rank: { type: 'string' }, badgeNumber: { type: 'string' }, mobileNumber: { type: 'string' }, policeStationId: { type: 'string' } } } } } },
                    responses: { 201: { description: 'Officer created' } }
                }
            },
            '/officers/statistics': {
                get: {
                    tags: ['Officers'],
                    summary: 'Get officer statistics',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'Officer statistics' } }
                }
            },
            '/officers/workload': {
                get: {
                    tags: ['Officers'],
                    summary: 'Get workload distribution',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'Workload distribution' } }
                }
            },
            '/officers/{id}': {
                get: {
                    tags: ['Officers'],
                    summary: 'Get officer by ID',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Officer details' } }
                },
                put: {
                    tags: ['Officers'],
                    summary: 'Update officer',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, rank: { type: 'string' }, mobileNumber: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Officer updated' } }
                },
                delete: {
                    tags: ['Officers'],
                    summary: 'Delete officer',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Officer deleted' } }
                }
            },
            '/officers/{id}/assign-beat': {
                post: {
                    tags: ['Officers'],
                    summary: 'Assign officer to beat',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { beatId: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Beat assigned' } }
                }
            },
            '/officers/{id}/transfer': {
                post: {
                    tags: ['Officers'],
                    summary: 'Transfer officer to new beat/station',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['newBeatId', 'newPoliceStationId', 'effectiveDate', 'reason'], properties: { newBeatId: { type: 'string' }, newPoliceStationId: { type: 'string' }, effectiveDate: { type: 'string', format: 'date-time' }, reason: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Officer transferred' } }
                }
            },
            '/officers/{id}/transfer/preview': {
                post: {
                    tags: ['Officers'],
                    summary: 'Preview officer transfer impact',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['newBeatId'], properties: { newBeatId: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Transfer preview' } }
                }
            },
            '/officers/{id}/transfer-history': {
                get: {
                    tags: ['Officers'],
                    summary: 'Get officer transfer history',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Transfer history' } }
                }
            },
            // ========== VISITS ==========
            '/visits': {
                get: {
                    tags: ['Visits'],
                    summary: 'Get all visits with filters',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'status', in: 'query', schema: { type: 'string', enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'] } },
                        { name: 'visitType', in: 'query', schema: { type: 'string', enum: ['Routine', 'Emergency', 'Follow-up', 'Verification'] } },
                        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
                        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } }
                    ],
                    responses: { 200: { description: 'List of visits' } }
                },
                post: {
                    tags: ['Visits'],
                    summary: 'Schedule a new visit',
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['seniorCitizenId', 'officerId', 'scheduledDate', 'visitType'], properties: { seniorCitizenId: { type: 'string' }, officerId: { type: 'string' }, scheduledDate: { type: 'string', format: 'date-time' }, visitType: { type: 'string', enum: ['Routine', 'Emergency', 'Follow-up', 'Verification'] } } } } } },
                    responses: { 201: { description: 'Visit scheduled' } }
                }
            },
            '/visits/officer/assignments': {
                get: {
                    tags: ['Visits'],
                    summary: 'Get visits assigned to current officer',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'List of assigned visits' } }
                }
            },
            '/visits/statistics': {
                get: {
                    tags: ['Visits'],
                    summary: 'Get visit statistics',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'Visit statistics' } }
                }
            },
            '/visits/calendar': {
                get: {
                    tags: ['Visits'],
                    summary: 'Get visit calendar',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'startDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
                        { name: 'endDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } }
                    ],
                    responses: { 200: { description: 'Calendar events' } }
                }
            },
            '/visits/auto-schedule': {
                post: {
                    tags: ['Visits'],
                    summary: 'Auto-schedule visits based on rules',
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['startDate', 'endDate'], properties: { startDate: { type: 'string', format: 'date' }, endDate: { type: 'string', format: 'date' } } } } } },
                    responses: { 200: { description: 'Auto-schedule result' } }
                }
            },
            '/visits/{id}': {
                get: {
                    tags: ['Visits'],
                    summary: 'Get visit by ID',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Visit details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Visit' } } } } }
                },
                put: {
                    tags: ['Visits'],
                    summary: 'Update visit',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Visit' } } } },
                    responses: { 200: { description: 'Visit updated' } }
                }
            },
            '/visits/{id}/start': {
                post: {
                    tags: ['Visits'],
                    summary: 'Start a visit',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['latitude', 'longitude'], properties: { latitude: { type: 'number' }, longitude: { type: 'number' } } } } } },
                    responses: { 200: { description: 'Visit started' } }
                }
            },
            '/visits/{id}/complete': {
                post: {
                    tags: ['Visits'],
                    summary: 'Mark visit as completed (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { notes: { type: 'string' }, photoUrl: { type: 'string' }, latitude: { type: 'number' }, longitude: { type: 'number' } } } } } },
                    responses: { 200: { description: 'Visit completed' } }
                }
            },
            '/visits/{id}/officer-complete': {
                post: {
                    tags: ['Visits'],
                    summary: 'Complete visit as officer',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { notes: { type: 'string' }, photoUrl: { type: 'string' }, riskScore: { type: 'integer' }, assessmentData: { type: 'object' } } } } } },
                    responses: { 200: { description: 'Visit completed by officer' } }
                }
            },
            '/visits/{id}/cancel': {
                post: {
                    tags: ['Visits'],
                    summary: 'Cancel a visit',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['reason'], properties: { reason: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Visit cancelled' } }
                }
            },
            // ========== SOS ALERTS ==========
            '/sos': {
                get: {
                    tags: ['SOS'],
                    summary: 'Get all SOS alerts',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['Active', 'Responded', 'Resolved', 'False Alarm'] } }],
                    responses: { 200: { description: 'List of SOS alerts' } }
                },
                post: {
                    tags: ['SOS'],
                    summary: 'Create SOS alert (Panic Button)',
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['latitude', 'longitude'], properties: { latitude: { type: 'number' }, longitude: { type: 'number' }, address: { type: 'string' } } } } } },
                    responses: { 201: { description: 'SOS alert created' } }
                }
            },
            '/sos/active': {
                get: {
                    tags: ['SOS'],
                    summary: 'Get active alerts (Real-time monitoring)',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'List of active alerts' } }
                }
            },
            '/sos/statistics': {
                get: {
                    tags: ['SOS'],
                    summary: 'Get SOS statistics',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'SOS statistics' } }
                }
            },
            '/sos/citizen/{citizenId}': {
                get: {
                    tags: ['SOS'],
                    summary: 'Get alert history for a citizen',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'citizenId', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Citizen alert history' } }
                }
            },
            '/sos/{id}': {
                get: {
                    tags: ['SOS'],
                    summary: 'Get SOS alert by ID',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'SOS alert details', content: { 'application/json': { schema: { $ref: '#/components/schemas/SOSAlert' } } } } }
                }
            },
            '/sos/{id}/status': {
                patch: {
                    tags: ['SOS'],
                    summary: 'Update alert status',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['Active', 'Responded', 'Resolved', 'False Alarm'] }, notes: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Status updated' } }
                }
            },
            '/sos/{id}/location': {
                post: {
                    tags: ['SOS'],
                    summary: 'Update location during SOS',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['latitude', 'longitude'], properties: { latitude: { type: 'number' }, longitude: { type: 'number' }, batteryLevel: { type: 'integer' }, deviceInfo: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Location updated' } }
                }
            },
            // ========== BEATS ==========
            '/beats': {
                get: {
                    tags: ['Beats'],
                    summary: 'Get all beats',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'policeStationId', in: 'query', schema: { type: 'string' } }],
                    responses: { 200: { description: 'List of beats' } }
                },
                post: {
                    tags: ['Beats'],
                    summary: 'Create new beat',
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'code', 'policeStationId'], properties: { name: { type: 'string' }, code: { type: 'string' }, policeStationId: { type: 'string' } } } } } },
                    responses: { 201: { description: 'Beat created' } }
                }
            },
            '/beats/{id}': {
                get: {
                    tags: ['Beats'],
                    summary: 'Get beat by ID',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Beat details' } }
                },
                put: {
                    tags: ['Beats'],
                    summary: 'Update beat',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, code: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Beat updated' } }
                },
                delete: {
                    tags: ['Beats'],
                    summary: 'Delete beat',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Beat deleted' } }
                }
            },
            // ========== REPORTS ==========
            '/reports/dashboard': {
                get: {
                    tags: ['Reports'],
                    summary: 'Get dashboard statistics',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'policeStationId', in: 'query', schema: { type: 'string' } },
                        { name: 'beatId', in: 'query', schema: { type: 'string' } },
                        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
                        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } }
                    ],
                    responses: { 200: { description: 'Dashboard stats' } }
                }
            },
            '/reports/demographics': {
                get: {
                    tags: ['Reports'],
                    summary: 'Get citizen demographics',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'Demographics data' } }
                }
            },
            '/reports/visits': {
                get: {
                    tags: ['Reports'],
                    summary: 'Get visit analytics',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'policeStationId', in: 'query', schema: { type: 'string' } },
                        { name: 'groupBy', in: 'query', schema: { type: 'string', enum: ['day', 'week', 'month'] } }
                    ],
                    responses: { 200: { description: 'Visit analytics' } }
                }
            },
            '/reports/performance': {
                get: {
                    tags: ['Reports'],
                    summary: 'Get officer performance report',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'policeStationId', in: 'query', schema: { type: 'string' } },
                        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
                        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } }
                    ],
                    responses: { 200: { description: 'Performance report' } }
                }
            },
            '/reports/export': {
                get: {
                    tags: ['Reports'],
                    summary: 'Export data (CSV/JSON)',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'type', in: 'query', required: true, schema: { type: 'string', enum: ['citizens', 'visits', 'sos'] } },
                        { name: 'format', in: 'query', schema: { type: 'string', enum: ['csv', 'json'] } }
                    ],
                    responses: { 200: { description: 'Exported data file' } }
                }
            },
            // ========== NOTIFICATIONS ==========
            '/notifications': {
                get: {
                    tags: ['Notifications'],
                    summary: 'Get user notifications',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'List of notifications' } }
                }
            },
            '/notifications/read-all': {
                patch: {
                    tags: ['Notifications'],
                    summary: 'Mark all notifications as read',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'All marked as read' } }
                }
            },
            '/notifications/{id}/read': {
                patch: {
                    tags: ['Notifications'],
                    summary: 'Mark notification as read',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Marked as read' } }
                }
            },
            '/notifications/{id}': {
                delete: {
                    tags: ['Notifications'],
                    summary: 'Delete notification',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Notification deleted' } }
                }
            },
            '/notifications/send': {
                post: {
                    tags: ['Notifications'],
                    summary: 'Send single notification (Admin)',
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['recipient', 'message', 'type'], properties: { recipient: { type: 'string' }, message: { type: 'string' }, type: { type: 'string', enum: ['SMS', 'EMAIL', 'PUSH', 'IN_APP'] }, subject: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Notification sent' } }
                }
            },
            '/notifications/bulk': {
                post: {
                    tags: ['Notifications'],
                    summary: 'Send bulk notifications (Admin)',
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['recipients', 'message', 'type'], properties: { recipients: { type: 'array', items: { type: 'string' } }, message: { type: 'string' }, type: { type: 'string', enum: ['SMS', 'EMAIL', 'PUSH', 'IN_APP'] }, subject: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Notifications sent' } }
                }
            },
            '/notifications/test': {
                post: {
                    tags: ['Notifications'],
                    summary: 'Send test notification (Admin)',
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['recipient', 'type'], properties: { recipient: { type: 'string' }, type: { type: 'string', enum: ['SMS', 'EMAIL', 'PUSH', 'IN_APP'] } } } } } },
                    responses: { 200: { description: 'Test notification sent' } }
                }
            }
        }
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

const normalizePath = (path: string) => {
    if (!path.startsWith('/')) {
        return `/${path}`;
    }
    return path;
};

export const setupSwagger = (app: Express, basePath: string = '/api-docs') => {
    const docsPath = normalizePath(basePath);
    const docsJsonPath = `${docsPath}.json`;

    // Type assertion needed due to swagger-ui-express type definitions
    app.use(docsPath, swaggerUi.serve as any, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Senior Citizen Portal API',
    }) as any);

    // Serve raw swagger JSON
    app.get(docsJsonPath, (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log(`📚 Swagger documentation available at ${docsPath}`);
};

export default swaggerSpec;
