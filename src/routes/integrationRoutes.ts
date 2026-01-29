import express from 'express';
import { Request, Response } from 'express';
import { authenticateApiKey } from '../middleware/apiKeyAuth';
import webhookService, { WebhookEvent } from '../services/webhookService';
import apiKeyService from '../services/apiKeyService';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

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
router.post('/webhooks', authenticateApiKey, asyncHandler(async (req: Request, res: Response) => {
    const { url, events, secret } = req.body;

    if (!url || !events || !Array.isArray(events)) {
        res.status(400).json({
            success: false,
            message: 'Missing required fields: url, events'
        });
        return;
    }

    const webhookId = webhookService.registerWebhook(url, events as WebhookEvent[], secret);

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
router.get('/webhooks', authenticateApiKey, asyncHandler(async (_req: Request, res: Response) => {
    const webhooks = webhookService.listWebhooks();

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
router.delete('/webhooks/:webhookId', authenticateApiKey, asyncHandler(async (req: Request, res: Response) => {
    const { webhookId } = req.params;
    const deleted = webhookService.deleteWebhook(webhookId);

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
router.get('/api-keys', asyncHandler(async (_req: Request, res: Response) => {
    const apiKeys = apiKeyService.listApiKeys();

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
router.post('/api-keys', asyncHandler(async (req: Request, res: Response) => {
    const { name, permissions, rateLimit } = req.body;

    if (!name || !permissions) {
        res.status(400).json({
            success: false,
            message: 'Missing required fields: name, permissions'
        });
        return;
    }

    const apiKey = apiKeyService.generateApiKey(name, permissions, rateLimit);

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
router.get('/test', authenticateApiKey, (req: Request, res: Response) => {
    const apiKey = (req as any).apiKey;

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

export default router;
