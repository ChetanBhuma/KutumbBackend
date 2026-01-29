import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMaritalStatuses = async (_req: Request, res: Response) => {
    try {
        const statuses = await prisma.maritalStatus.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(statuses);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching marital statuses' });
    }
};

export const createMaritalStatus = async (req: Request, res: Response) => {
    try {
        const { code, name, description } = req.body;
        const status = await prisma.maritalStatus.create({
            data: { code, name, description },
        });
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: 'Error creating marital status' });
    }
};

export const updateMaritalStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;
        const status = await prisma.maritalStatus.update({
            where: { id },
            data: { name, description, isActive },
        });
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: 'Error updating marital status' });
    }
};

export const deleteMaritalStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.maritalStatus.delete({
            where: { id },
        });
        res.json({ message: 'Marital status deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting marital status' });
    }
};
