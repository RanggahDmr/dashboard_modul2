import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding score thresholds...');

  const thresholds = [
    { description: 'sangat_tinggi', nominal: 90 },
    { description: 'tinggi', nominal: 75 },
    { description: 'sedang', nominal: 60 },
    { description: 'eligible_insentif', nominal: 60 },
  ];

  for (const t of thresholds) {
    const exists = await prisma.scoreThreshold.findFirst({
      where: { description: t.description },
    });

    if (!exists) {
      await prisma.scoreThreshold.create({
        data: t,
      });
    } else {
      await prisma.scoreThreshold.updateMany({
        where: { description: t.description },
        data: { nominal: t.nominal },
      });
    }
  }

  console.log('Score thresholds seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
