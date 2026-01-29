// Example: Citizen Service Tests
import citizenService from '../../services/citizenService';
import { prisma } from '../setup';

describe('Citizen Service', () => {
    describe('createCitizen', () => {
        it('should create a new citizen', async () => {
            const citizenData = {
                fullName: 'John Doe',
                age: 70,
                gender: 'Male',
                mobileNumber: '+919876543210',
                permanentAddress: 'Test Address',
            };

            const mockCitizen = {
                id: 'citizen_123',
                ...citizenData,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.seniorCitizen.create as jest.Mock).mockResolvedValue(mockCitizen);

            const result = await citizenService.createCitizen(citizenData);

            expect(result).toEqual(mockCitizen);
            expect(prisma.seniorCitizen.create).toHaveBeenCalledWith({
                data: expect.objectContaining(citizenData),
            });
        });
    });

    describe('getCitizenById', () => {
        it('should return a citizen by ID', async () => {
            const mockCitizen = {
                id: 'citizen_123',
                fullName: 'John Doe',
                age: 70,
            };

            (prisma.seniorCitizen.findUnique as jest.Mock).mockResolvedValue(mockCitizen);

            const result = await citizenService.getCitizenById('citizen_123');

            expect(result).toEqual(mockCitizen);
            expect(prisma.seniorCitizen.findUnique).toHaveBeenCalledWith({
                where: { id: 'citizen_123' },
                include: expect.any(Object),
            });
        });

        it('should return null for non-existent citizen', async () => {
            (prisma.seniorCitizen.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await citizenService.getCitizenById('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('updateCitizen', () => {
        it('should update citizen data', async () => {
            const updateData = {
                fullName: 'Jane Doe Updated',
                age: 71,
            };

            const mockUpdatedCitizen = {
                id: 'citizen_123',
                ...updateData,
            };

            (prisma.seniorCitizen.update as jest.Mock).mockResolvedValue(mockUpdatedCitizen);

            const result = await citizenService.updateCitizen('citizen_123', updateData);

            expect(result).toEqual(mockUpdatedCitizen);
            expect(prisma.seniorCitizen.update).toHaveBeenCalledWith({
                where: { id: 'citizen_123' },
                data: updateData,
            });
        });
    });

    describe('deleteCitizen', () => {
        it('should delete a citizen', async () => {
            (prisma.seniorCitizen.delete as jest.Mock).mockResolvedValue({ id: 'citizen_123' });

            await citizenService.deleteCitizen('citizen_123');

            expect(prisma.seniorCitizen.delete).toHaveBeenCalledWith({
                where: { id: 'citizen_123' },
            });
        });
    });
});
