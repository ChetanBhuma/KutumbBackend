import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ExportService } from '../services/exportService';

export class ExportController {
    /**
     * Export Citizens to CSV
     */
    static async exportCitizens(req: Request, res: Response) {
        try {
            const { districtId, policeStationId, beatId, status, vulnerabilityLevel, search } = req.query;

            const where: any = {};

            if (districtId) where.Beat = { PoliceStation: { districtId: String(districtId) } };
            if (policeStationId) where.Beat = { ...where.Beat, policeStationId: String(policeStationId) };
            if (beatId) where.beatId = String(beatId);
            if (status) where.status = String(status);
            if (vulnerabilityLevel) where.vulnerabilityLevel = String(vulnerabilityLevel);

            if (search) {
                where.OR = [
                    { fullName: { contains: String(search), mode: 'insensitive' } },
                    { mobileNumber: { contains: String(search) } },
                    { aadhaarNumber: { contains: String(search) } }
                ];
            }

            const citizens = await prisma.seniorCitizen.findMany({
                where,
                include: {
                    PoliceStation: {
                        include: {
                            District: true
                        }
                    },
                    Beat: {
                        include: {
                            PoliceStation: {
                                include: {
                                    District: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const csv = await ExportService.generateCitizensCSV(citizens);

            res.header('Content-Type', 'text/csv');
            res.header('Content-Disposition', `attachment; filename=citizens_export_${Date.now()}.csv`);
            res.send(csv);

        } catch (error) {
            console.error('Error exporting citizens:', error);
            res.status(500).json({ success: false, message: 'Failed to export citizens' });
        }
    }

    /**
     * Export Visits to Excel
     */
    static async exportVisits(req: Request, res: Response) {
        try {
            const { startDate, endDate, status, officerId, search, visitType } = req.query;

            const where: any = {};

            if (startDate && endDate) {
                where.scheduledDate = {
                    gte: new Date(String(startDate)),
                    lte: new Date(String(endDate))
                };
            }
            if (status) where.status = String(status);
            if (officerId) where.officerId = String(officerId);
            if (visitType) where.visitType = String(visitType);

            if (search) {
                where.OR = [
                    { SeniorCitizen: { fullName: { contains: String(search), mode: 'insensitive' } } },
                    { SeniorCitizen: { mobileNumber: { contains: String(search) } } },
                    { officer: { name: { contains: String(search), mode: 'insensitive' } } }
                ];
            }

            const visits = await prisma.visit.findMany({
                where,
                include: {
                    SeniorCitizen: true,
                    officer: true
                },
                orderBy: { scheduledDate: 'desc' }
            });

            const buffer = await ExportService.generateVisitsExcel(visits);

            res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.header('Content-Disposition', `attachment; filename=visits_export_${Date.now()}.xlsx`);
            res.send(buffer);

        } catch (error) {
            console.error('Error exporting visits:', error);
            res.status(500).json({ success: false, message: 'Failed to export visits' });
        }
    }

    /**
     * Generate PDF Report
     */
    static async generateReport(req: Request, res: Response) {
        try {
            const { type } = req.query; // e.g., 'monthly_summary'

            let data: any = {
                title: 'General Report',
                type: 'summary',
                stats: {}
            };

            if (type === 'monthly_summary') {
                const totalCitizens = await prisma.seniorCitizen.count();
                const totalVisits = await prisma.visit.count();
                const activeAlerts = await prisma.sOSAlert.count({ where: { status: 'Active' } });

                data = {
                    title: 'Monthly Summary Report',
                    type: 'summary',
                    stats: {
                        'Total Citizens': totalCitizens,
                        'Total Visits': totalVisits,
                        'Active SOS Alerts': activeAlerts
                    }
                };
            }

            res.header('Content-Type', 'application/pdf');
            res.header('Content-Disposition', `attachment; filename=report_${Date.now()}.pdf`);

            ExportService.generateReportPDF(data, res);

        } catch (error) {
            console.error('Error generating report:', error);
            res.status(500).json({ success: false, message: 'Failed to generate report' });
        }
    }
}
