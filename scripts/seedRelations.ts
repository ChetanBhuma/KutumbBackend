
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const relations = [
  { code: '001', name: 'FATHER' },
  { code: '002', name: 'MOTHER' },
  { code: '003', name: 'ELDER BROTHER' },
  { code: '004', name: 'BROTHER' },
  { code: '005', name: 'TWIN BROTHER' },
  { code: '006', name: 'SISTER' },
  { code: '007', name: 'HUSBAND' },
  { code: '008', name: 'WIFE' },
  { code: '009', name: 'SON' },
  { code: '010', name: 'DAUGHTER' },
  { code: '011', name: 'STEP FATHER' },
  { code: '012', name: 'STEP MOTHER' },
  { code: '013', name: 'STEP BROTHER' },
  { code: '014', name: 'STEP SISTER' },
  { code: '015', name: 'UNCLE' },
  { code: '016', name: 'AUNTY' },
  { code: '017', name: 'COUSIN' },
  { code: '018', name: 'MATERNAL UNCLE' },
  { code: '019', name: 'DAUGHTER-IN-LAW' },
  { code: '020', name: 'SISTER-IN-LAW(BHABHEE)' },
  { code: '021', name: 'PARAMOUR ( ILLICIT RELATION )' },
  { code: '022', name: 'BELOVED' },
  { code: '023', name: 'KEEPER' },
  { code: '024', name: 'SISTER-IN-LAW(JETHANI)' },
  { code: '025', name: 'SISTER-IN-LAW(DEVRANI)' },
  { code: '026', name: 'BROTHER-IN-LAW(JIJA)' },
  { code: '027', name: 'SISTER-IN-LAW(SALI)' },
  { code: '028', name: 'BROTHER-IN-LAW(DEVER)' },
  { code: '029', name: 'FATHER-IN-LAW' },
  { code: '030', name: 'MOTHER-IN-LAW' },
  { code: '031', name: 'GRANDFATHER' },
  { code: '032', name: 'GRANDMOTHER' },
  { code: '033', name: 'MATERNAL GRAND FATHER' },
  { code: '034', name: 'MATERNAL GRAND MOTHER' },
  { code: '035', name: 'MATERNAL GRAND UNCLE' },
  { code: '036', name: 'MATARNAL GRAND ANTEE' },
  { code: '037', name: 'FRIEND' },
  { code: '038', name: 'LOVER' },
  { code: '039', name: 'SON-IN-LAW' },
  { code: '040', name: 'PATERNAL UNCLE' },
  { code: '041', name: 'NEPHEW' },
  { code: '042', name: 'MATERNAL AUNTY' },
  { code: '043', name: 'PATERNAL AUNTY' },
  { code: '044', name: 'GRAND SON' },
  { code: '045', name: 'GRAND DAUGHTER' },
  { code: '046', name: 'NIECE' },
  { code: '047', name: 'BROTHER-IN-LAW(SALA)' },
  { code: '048', name: 'BROTHER-IN-LAW(JETH)' },
  { code: '049', name: 'LANDLORD' },
  { code: '050', name: 'NEIGHBOUR' },
  { code: '051', name: 'TENANT' },
  { code: '052', name: 'SISTER-IN-LAW' },
  { code: '053', name: 'BROTHER-IN-LAW' },
  { code: '054', name: 'NA' }
];

async function main() {
  console.log('Seeding relations...');
  for (const relation of relations) {
    await prisma.systemMaster.upsert({
      where: {
        type_code: {
          type: 'RELATION',
          code: relation.code
        }
      },
      update: {
        name: relation.name
      },
      create: {
        type: 'RELATION',
        code: relation.code,
        name: relation.name,
        order: parseInt(relation.code)
      }
    });
  }
  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
