import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function seedDatabase() {
  try {
    const casesCount = await prisma.case.count();
    if (casesCount === 0) {
      console.log('Seeding initial cases...');
      const dataPath = path.join(__dirname, '../data/sampleCases.json');
      if (fs.existsSync(dataPath)) {
        const fileContent = fs.readFileSync(dataPath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        for (const item of data.cases) {
          await prisma.case.create({
            data: {
              id: item.id,
              title: item.title,
              timestamp: new Date(item.timestamp),
              type: item.type,
              riskScore: item.riskScore,
              status: item.status,
              transcript: item.transcript_excerpt,
              patterns: JSON.stringify(item.detected_patterns || []),
              phone: item.phone_number,
              duration: item.duration_seconds?.toString(),
              amount: item.amount_at_risk ? parseFloat(item.amount_at_risk.replace(/[^0-9.]/g, '')) : null,
              createdBy: 'system'
            }
          });
        }
        console.log(`Seeded ${data.cases.length} cases successfully.`);
      }
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}
