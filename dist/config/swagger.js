"use strict";
/**
 * Swagger/OpenAPI Documentation Configuration
 * Access at: http://localhost:5000/api-docs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
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
            { name: 'Bulk Operations', description: 'Bulk data processing' },
            { name: 'System', description: 'System configuration and logs' },
            { name: 'Reports', description: 'Analytics and reporting' },
            { name: 'Notifications', description: 'Notification management' },
            { name: 'Roles', description: 'Role definitions and permissions' },
            { name: 'Users', description: 'User directory and role assignment' },
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
            }
        }
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
const normalizePath = (path) => {
    if (!path.startsWith('/')) {
        return `/${path}`;
    }
    return path;
};
const setupSwagger = (app, basePath = '/api-docs') => {
    const docsPath = normalizePath(basePath);
    const docsJsonPath = `${docsPath}.json`;
    // Type assertion needed due to swagger-ui-express type definitions
    app.use(docsPath, swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Senior Citizen Portal API',
    }));
    // Serve raw swagger JSON
    app.get(docsJsonPath, (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
    console.log(`📚 Swagger documentation available at ${docsPath}`);
};
exports.setupSwagger = setupSwagger;
exports.default = swaggerSpec;
//# sourceMappingURL=swagger.js.map