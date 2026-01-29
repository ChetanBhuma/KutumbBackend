import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getRiskFactors = async (_req: Request, res: Response) => {
    try {
        const factors = await prisma.riskFactor.findMany({
            orderBy: { weight: 'desc' },
        });
        res.json(factors);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching risk factors' });
    }
};

export const createRiskFactor = async (req: Request, res: Response) => {
    try {
        const { code, name, description, weight, category } = req.body;
        const factor = await prisma.riskFactor.create({
            data: { code, name, description, weight, category },
        });
        res.json(factor);
    } catch (error) {
        res.status(500).json({ error: 'Error creating risk factor' });
    }
};

export const updateRiskFactor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, weight, category, isActive } = req.body;
        const factor = await prisma.riskFactor.update({
            where: { id },
            data: { name, description, weight, category, isActive },
        });
        res.json(factor);
    } catch (error) {
        res.status(500).json({ error: 'Error updating risk factor' });
    }
};

export const deleteRiskFactor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.riskFactor.delete({
            where: { id },
        });
        res.json({ message: 'Risk factor deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting risk factor' });
    }
};
