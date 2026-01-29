# Master Data Seeding Guide

This directory contains seed scripts for populating master data tables in the Senior Citizen Portal database.

## Available Seed Scripts

### `masterDataSeed.ts`
Comprehensive seed script that populates all master data tables with Delhi Police information.

**Includes:**
- **Roles** (4 roles): Super Admin, Admin, Officer, Supervisor
- **Districts** (12 districts): All Delhi Police districts across 7 ranges
- **Police Stations** (16 stations): Major police stations across Delhi
- **Designations** (18 ranks): Police, Admin, Technical, and Support departments
- **Visit Types** (9 types): Different visit categories with priorities
- **Health Conditions** (17 conditions): Medical conditions with severity levels

## Running Seed Scripts

### Prerequisites
```bash
# Ensure Prisma is properly configured
cd backend
npm install
```

### Run All Master Data Seeds
```bash
npx ts-node prisma/seeds/masterDataSeed.ts
```

### Alternative: Using Prisma Seed Command
Add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seeds/masterDataSeed.ts"
  }
}
```

Then run:
```bash
npx prisma db seed
```

## Data Overview

### Roles (4)
| Code | Name | Permissions |
|------|------|-------------|
| SUPER_ADMIN | Super Administrator | All 40+ permissions |
| ADMIN | Administrator | Management permissions |
| OFFICER | Police Officer | Operational permissions |
| SUPERVISOR | Supervisor | Approval permissions |

### Districts (12)
**Ranges:** NORTH, SOUTH, EAST, WEST, CENTRAL, OUTER, NEW DELHI

| District | Range | Population | Headquarters |
|----------|-------|------------|--------------|
| North District | NORTH | 887,978 | Mukherjee Nagar |
| North-West District | NORTH | 3,656,539 | Rohini |
| South District | SOUTH | 2,733,752 | Saket |
| Central District | CENTRAL | 644,005 | Kamla Market |
| ... | ... | ... | ... |

### Police Stations (16)
Major stations across all ranges including:
- Civil Lines, Model Town (North)
- Rohini North/South, Sultanpuri (North-West)
- Hauz Khas, Saket, Malviya Nagar (South)
- Dwarka North/South (South-West)
- Connaught Place, Chandni Chowk (Central)
- Parliament Street (New Delhi)

### Designations (18)
**Hierarchy (Level 1-10):**
1. Director General of Police (DGP)
2. Additional DGP (ADGP)
3. Inspector General (IGP)
4. Deputy Commissioner (DCP)
5. Assistant Commissioner (ACP)
6. Inspector (INSP)
7. Sub-Inspector (SI)
8. Assistant Sub-Inspector (ASI)
9. Head Constable (HC)
10. Constable (CONST)

**Other Departments:**
- Admin: Chief Administrative Officer, Admin Manager, Admin Officer
- Technical: Technical Head, Technical Lead, Technical Analyst
- Support: Support Manager, Support Officer

### Visit Types (9)
| Priority | Type | Duration | Approval |
|----------|------|----------|----------|
| P1 (Critical) | Health Emergency | 45 min | No |
| P2 (High) | Safety Inspection | 45 min | Yes |
| P2 (High) | Complaint Response | 40 min | No |
| P3 (Medium) | Routine Check | 30 min | No |
| P3 (Medium) | Welfare Check | 30 min | No |
| P4 (Low) | Monthly Review | 60 min | Yes |

### Health Conditions (17)
**By Severity:**

**Critical:**
- Heart Disease ⚠️ (Special Care)
- Stroke ⚠️ (Special Care)
- Kidney Failure ⚠️ (Special Care)
- Cancer ⚠️ (Special Care)

**High:**
- Diabetes ⚠️ (Special Care)
- Hypertension ⚠️ (Special Care)
- COPD ⚠️ (Special Care)
- Dementia ⚠️ (Special Care)

**Medium:**
- Arthritis, Osteoporosis, Asthma
- Depression, Vision Loss, Mobility Issues

**Low:**
- Hearing Loss, Thyroid Disorder

## Customization

### Adding More Data
Edit `masterDataSeed.ts` and add entries tothe respective arrays:

```typescript
const newPoliceStation = {
  code: 'PS_YOUR_STATION',
  name: 'Your Station Name',
  district: 'District Name',
  range: 'RANGE_NAME',
  address: 'Full Address',
  contactNumber: '011-XXXXXXXX',
  inchargeOfficer: 'Officer Name',
  isActive: true,
};
```

### Updating Existing Data
The seed script uses `upsert` operations, so running it again will update existing records based on their unique codes.

## Verification

After seeding, verify the data:

```bash
# Check record counts
npx prisma studio

# Or use Prisma CLI
npx prisma db pull
```

## Troubleshooting

**Error: Module not found**
```bash
npm install --save-dev ts-node
```

**Error: Cannot find module '@prisma/client'**
```bash
npx prisma generate
```

**Error: Unique constraint violation**
- Data already exists
- Run `npx prisma migrate reset` to clear and reseed

## Production Considerations

1. **Backup First**: Always backup production database before seeding
2. **Staged Rollout**: Test seeds in development → staging → production
3. **Audit Trail**: Enable logging before running seeds
4. **Rollback Plan**: Have a rollback script ready
5. **Verify Counts**: Check record counts before and after

## Next Steps

After seeding:
1. ✅ Verify all records in Prisma Studio
2. ✅ Test master data APIs
3. ✅ Check frontend pages display data correctly
4. ✅ Assign initial users to roles
5. ✅ Create initial beat assignments
