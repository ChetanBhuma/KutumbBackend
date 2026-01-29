"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRiskFactor = exports.updateRiskFactor = exports.createRiskFactor = exports.getRiskFactors = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getRiskFactors = async (_req, res) => {
    try {
        const factors = await prisma.riskFactor.findMany({
            orderBy: { weight: 'desc' },
        });
        res.json(factors);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching risk factors' });
    }
};
exports.getRiskFactors = getRiskFactors;
const createRiskFactor = async (req, res) => {
    try {
        const { code, name, description, weight, category } = req.body;
        const factor = await prisma.riskFactor.create({
            data: { code, name, description, weight, category },
        });
        res.json(factor);
    }
    catch (error) {
        res.status(500).json({ error: 'Error creating risk factor' });
    }
};
exports.createRiskFactor = createRiskFactor;
const updateRiskFactor = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, weight, category, isActive } = req.body;
        const factor = await prisma.riskFactor.update({
            where: { id },
            data: { name, description, weight, category, isActive },
        });
        res.json(factor);
    }
    catch (error) {
        res.status(500).json({ error: 'Error updating risk factor' });
    }
};
exports.updateRiskFactor = updateRiskFactor;
const deleteRiskFactor = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.riskFactor.delete({
            where: { id },
        });
        res.json({ message: 'Risk factor deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error deleting risk factor' });
    }
};
exports.deleteRiskFactor = deleteRiskFactor;
//# sourceMappingURL=riskFactorController.js.map