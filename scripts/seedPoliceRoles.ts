import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPoliceRoles() {
    console.log('Seeding Police Roles...');

    // Base permissions for valid officers
    const baseOfficerPermissions = [
        'citizens.read',
        'visits.read', 'visits.complete',
        'sos.read', 'sos.respond',
        'reports.read'
    ];

    // Higher access additions
    const managePermissions = ['officers.read', 'officers.manage', 'reports.generate', 'reports.export'];
    const deletePermissions = ['citizens.delete', 'officers.delete'];

    const policeRoles = [
        {
            code: 'COMMISSIONER',
            name: 'Commissioner of Police',
            description: 'Top level access',
            permissions: [...baseOfficerPermissions, ...managePermissions, ...deletePermissions, 'system.settings']
        },
        {
            code: 'JOINT_CP',
            name: 'Joint Commissioner of Police',
            description: 'Range level access',
            permissions: [...baseOfficerPermissions, ...managePermissions]
        },
        {
            code: 'SPECIAL_CP',
            name: 'Special Commissioner of Police',
            description: 'Range level access',
            permissions: [...baseOfficerPermissions, ...managePermissions]
        },
        {
            code: 'DCP',
            name: 'Deputy Commissioner of Police',
            description: 'District level access',
            permissions: [...baseOfficerPermissions, ...managePermissions]
        },
        {
            code: 'ADDL_DCP',
            name: 'Additional DCP',
            description: 'District level access',
            permissions: [...baseOfficerPermissions, ...managePermissions]
        },
        {
            code: 'ACP',
            name: 'Assistant Commissioner of Police',
            description: 'Sub-division level access',
            permissions: [...baseOfficerPermissions, ...managePermissions]
        },
        {
            code: 'INSPECTOR',
            name: 'Inspector',
            description: 'Police Station level access',
            permissions: [...baseOfficerPermissions, 'officers.read']
        },
        {
            code: 'SHO',
            name: 'Station House Officer',
            description: 'Police Station In-charge',
            permissions: [...baseOfficerPermissions, 'officers.read', 'officers.manage']
        },
        {
            code: 'SUB_INSPECTOR',
            name: 'Sub-Inspector',
            description: 'Beat level access',
            permissions: [...baseOfficerPermissions]
        },
        {
            code: 'ASST_SUB_INSPECTOR',
            name: 'Assistant Sub-Inspector',
            description: 'Beat level access',
            permissions: [...baseOfficerPermissions]
        },
        {
            code: 'HEAD_CONSTABLE',
            name: 'Head Constable',
            description: 'Beat level access',
            permissions: [...baseOfficerPermissions]
        },
        {
            code: 'CONSTABLE',
            name: 'Constable',
            description: 'Beat level access',
            permissions: [...baseOfficerPermissions]
        },
        {
            code: 'BEAT_OFFICER',
            name: 'Beat Officer',
            description: 'Generic Beat Officer',
            permissions: [...baseOfficerPermissions]
        }
    ];

    for (const role of policeRoles) {
        await prisma.role.upsert({
            where: { code: role.code },
            update: {
                name: role.name,
                description: role.description,
                permissions: role.permissions,
                isActive: true
            },
            create: {
                code: role.code,
                name: role.name,
                description: role.description,
                permissions: role.permissions,
                isActive: true
            }
        });
        console.log(`Seeded Role: ${role.code}`);
    }
}

seedPoliceRoles()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
