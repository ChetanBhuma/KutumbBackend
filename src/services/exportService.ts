import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

export class ExportService {
    /**
     * Generate CSV for Citizens
     */
    static async generateCitizensCSV(citizens: any[]): Promise<string> {
        const fields = [
            { label: 'ID', value: 'id' },
            { label: 'Full Name', value: 'fullName' },
            { label: 'Mobile Number', value: 'mobileNumber' },
            { label: 'Gender', value: 'gender' },
            { label: 'Date of Birth', value: 'dateOfBirth' },
            { label: 'Address', value: 'address' },
            { label: 'District', value: 'PoliceStation.District.name' },
            { label: 'Police Station', value: 'PoliceStation.name' },
            { label: 'Beat', value: 'Beat.name' },
            { label: 'Status', value: 'status' },
            { label: 'Vulnerability', value: 'vulnerabilityLevel' }
        ];

        // Sanitize data to prevent CSV Injection (Formula Injection)
        const sanitize = (value: any) => {
            if (typeof value === 'string') {
                // Determine if it starts with forbidden characters
                if (/^[=+\-@]/.test(value)) {
                    // Prefix with a single quote to force text interpretation
                    return `'${value}`;
                }
            }
            return value;
        };

        const json2csvParser = new Parser({ fields });
        // We need to apply sanitization to the data passed to parser
        // However, json2csv handles object paths.
        // A better approach with json2csv is to utilize a transform function if available,
        // or pre-process the data completely even for nested fields.

        // Simplified approach: Iterate and sanitize specifically text fields that user inputs
        citizens.forEach(c => {
            if (c.fullName) c.fullName = sanitize(c.fullName);
            if (c.address) c.address = sanitize(c.address);
            if (c.Beat?.name) c.Beat.name = sanitize(c.Beat.name);
            if (c.PoliceStation?.name) c.PoliceStation.name = sanitize(c.PoliceStation.name);
            if (c.PoliceStation?.District?.name) c.PoliceStation.District.name = sanitize(c.PoliceStation.District.name);
        });

        return json2csvParser.parse(citizens);
    }

    /**
     * Generate Excel for Visits
     */
    static async generateVisitsExcel(visits: any[]): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Visits');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Citizen Name', key: 'citizenName', width: 20 },
            { header: 'Officer Name', key: 'officerName', width: 20 },
            { header: 'Visit Date', key: 'visitDate', width: 15 },
            { header: 'Purpose', key: 'purpose', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Outcome', key: 'outcome', width: 25 },
            { header: 'Notes', key: 'notes', width: 30 }
        ];

        visits.forEach(visit => {
            worksheet.addRow({
                id: visit.id,
                citizenName: visit.SeniorCitizen?.fullName || 'N/A',
                officerName: visit.BeatOfficer?.name || 'N/A',
                visitDate: visit.scheduledDate ? new Date(visit.scheduledDate).toLocaleDateString() : 'N/A',
                purpose: visit.visitType, // visitType is the field name in schema
                status: visit.status,
                outcome: visit.status === 'Completed' ? 'Completed' : 'Pending', // outcome not in schema, using status
                notes: visit.notes
            });
        });

        // Style header row
        worksheet.getRow(1).font = { bold: true };

        return await workbook.xlsx.writeBuffer() as unknown as Buffer;
    }

    /**
     * Generate PDF Report
     */
    static generateReportPDF(data: any, res: Response): void {
        const doc = new PDFDocument();

        // Pipe PDF to response
        doc.pipe(res);

        // Header
        doc.fontSize(20).text('Delhi Police Senior Citizen Cell', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(data.title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown();

        // Content based on report type
        if (data.type === 'summary') {
            doc.fontSize(14).text('Summary Statistics');
            doc.moveDown();

            Object.entries(data.stats).forEach(([key, value]) => {
                doc.fontSize(12).text(`${key}: ${value}`);
            });
        } else if (data.items && Array.isArray(data.items)) {
            doc.fontSize(14).text('Details');
            doc.moveDown();

            data.items.forEach((item: any, index: number) => {
                doc.fontSize(12).text(`${index + 1}. ${item.description || item.name || 'Item'}`);
                // Add more details as needed
            });
        }

        // Footer
        doc.end();
    }
}
