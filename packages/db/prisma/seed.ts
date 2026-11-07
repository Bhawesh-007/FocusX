import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'test@focus.local';
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      name: 'Test User',
      passwordHash,
      timezone: 'UTC',
    },
  });

  // Sample tasks for today (UTC date)
  const today = new Date();
  const todayDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  const existing = await prisma.task.findFirst({
    where: { userId: user.id, scheduledDate: todayDate },
  });

  if (!existing) {
    await prisma.task.createMany({
      data: [
        { userId: user.id, title: 'Read design docs', scheduledDate: todayDate, targetMinutes: 45 },
        { userId: user.id, title: 'Implement dashboard page', scheduledDate: todayDate, targetMinutes: 120 },
        { userId: user.id, title: 'Review PRs', scheduledDate: todayDate, targetMinutes: 30 },
      ],
    });
  }

  console.log(`Seeded user ${email} / ${password} with sample tasks for today.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
