"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMaritalStatus = exports.updateMaritalStatus = exports.createMaritalStatus = exports.getMaritalStatuses = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getMaritalStatuses = async (_req, res) => {
    try {
        const statuses = await prisma.maritalStatus.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(statuses);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching marital statuses' });
    }
};
exports.getMaritalStatuses = getMaritalStatuses;
const createMaritalStatus = async (req, res) => {
    try {
        const { code, name, description } = req.body;
        const status = await prisma.maritalStatus.create({
            data: { code, name, description },
        });
        res.json(status);
    }
    catch (error) {
        res.status(500).json({ error: 'Error creating marital status' });
    }
};
exports.createMaritalStatus = createMaritalStatus;
const updateMaritalStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;
        const status = await prisma.maritalStatus.update({
            where: { id },
            data: { name, description, isActive },
        });
        res.json(status);
    }
    catch (error) {
        res.status(500).json({ error: 'Error updating marital status' });
    }
};
exports.updateMaritalStatus = updateMaritalStatus;
const deleteMaritalStatus = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.maritalStatus.delete({
            where: { id },
        });
        res.json({ message: 'Marital status deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error deleting marital status' });
    }
};
exports.deleteMaritalStatus = deleteMaritalStatus;
//# sourceMappingURL=maritalStatusController.js.map