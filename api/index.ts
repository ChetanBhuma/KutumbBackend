import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Check for required environment variables first
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
    const missingVars = requiredVars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
        return res.status(500).json({
            error: 'Server configuration error',
            message: `Missing required environment variables: ${missingVars.join(', ')}`,
            hint: 'Please add these variables in Vercel Project Settings > Environment Variables'
        });
    }

    try {
        // Dynamically import app to defer initialization until env vars are checked
        const { default: app } = await import('../src/app');
        return app(req, res);
    } catch (error: any) {
        console.error('App initialization error:', error);
        return res.status(500).json({
            error: 'App initialization failed',
            message: error.message || 'Unknown error',
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
        });
    }
}
