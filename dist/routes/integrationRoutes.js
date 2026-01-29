"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const apiKeyAuth_1 = require("../middleware/apiKeyAuth");
const webhookService_1 = __importDefault(require("../services/webhookService"));
const apiKeyService_1 = __importDefault(require("../services/apiKeyService"));
const asyncHandler_1 = require("../middleware/asyncHandler");
const router = express_1.default.Router();
/**
 * @swagger
 * /integrations/webhooks:
 *   post:
 *     tags: [Webhooks]
 *     summary: Register a new webhook
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - events
 *             properties:
 *               url:
 *                 type: string
 *                 example: https://example.com/webhook
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["citizen.created", "sos.created"]
 *               secret:
 *                 type: string
 *     responses:
 *       201:
 *         description: Webhook registered successfully
 */
router.post('/webhooks', apiKeyAuth_1.authenticateApiKey, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { url, events, secret } = req.body;
    if (!url || !events || !Array.isArray(events)) {
        res.status(400).json({
            success: false,
            message: 'Missing required fields: url, events'
        });
        return;
    }
    const webhookId = webhookService_1.default.registerWebhook(url, events, secret);
    res.status(201).json({
        success: true,
        message: 'Webhook registered successfully',
        data: {
            webhookId,
            url,
            events
        }
    });
}));
/**
 * @swagger
 * /integrations/webhooks:
 *   get:
 *     tags: [Webhooks]
 *     summary: List all webhooks
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of webhooks
 */
router.get('/webhooks', apiKeyAuth_1.authenticateApiKey, (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const webhooks = webhookService_1.default.listWebhooks();
    res.status(200).json({
        success: true,
        data: {
            count: webhooks.length,
            webhooks
        }
    });
}));
/**
 * @swagger
 * /integrations/webhooks/{webhookId}:
 *   delete:
 *     tags: [Webhooks]
 *     summary: Delete a webhook
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: webhookId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook deleted successfully
 */
router.delete('/webhooks/:webhookId', apiKeyAuth_1.authenticateApiKey, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { webhookId } = req.params;
    const deleted = webhookService_1.default.deleteWebhook(webhookId);
    if (!deleted) {
        res.status(404).json({
            success: false,
            message: 'Webhook not found'
        });
        return;
    }
    res.status(200).json({
        success: true,
        message: 'Webhook deleted successfully'
    });
}));
/**
 * @swagger
 * /integrations/api-keys:
 *   get:
 *     tags: [API Keys]
 *     summary: List all API keys
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 */
router.get('/api-keys', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const apiKeys = apiKeyService_1.default.listApiKeys();
    res.status(200).json({
        success: true,
        data: {
            count: apiKeys.length,
            apiKeys
        }
    });
}));
/**
 * @swagger
 * /integrations/api-keys:
 *   post:
 *     tags: [API Keys]
 *     summary: Generate a new API key
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - permissions
 *             properties:
 *               name:
 *                 type: string
 *                 example: External Integration
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["citizens:read", "visits:read"]
 *               rateLimit:
 *                 type: number
 *                 example: 100
 *     responses:
 *       201:
 *         description: API key generated successfully
 */
router.post('/api-keys', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { name, permissions, rateLimit } = req.body;
    if (!name || !permissions) {
        res.status(400).json({
            success: false,
            message: 'Missing required fields: name, permissions'
        });
        return;
    }
    const apiKey = apiKeyService_1.default.generateApiKey(name, permissions, rateLimit);
    res.status(201).json({
        success: true,
        message: 'API key generated successfully',
        data: {
            id: apiKey.id,
            key: apiKey.key,
            name: apiKey.name,
            permissions: apiKey.permissions,
            rateLimit: apiKey.rateLimit
        }
    });
}));
/**
 * @swagger
 * /integrations/test:
 *   get:
 *     tags: [Webhooks]
 *     summary: Test webhook endpoint
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: API key authenticated successfully
 */
router.get('/test', apiKeyAuth_1.authenticateApiKey, (req, res) => {
    const apiKey = req.apiKey;
    res.status(200).json({
        success: true,
        message: 'API key authenticated successfully',
        data: {
            keyName: apiKey.name,
            permissions: apiKey.permissions,
            rateLimit: apiKey.rateLimit
        }
    });
});
exports.default = router;
//# sourceMappingURL=integrationRoutes.js.map