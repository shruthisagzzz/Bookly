import { PrismaClient, UserRole, ServiceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const ownerPassword = await bcrypt.hash(process.env.SEED_OWNER_PASSWORD ?? 'Owner123!', 12);
  const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!', 12);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.local' },
    update: { passwordHash: ownerPassword, name: 'Platform Owner', role: UserRole.SYSTEM_OWNER, tenantId: null },
    create: { email: 'owner@demo.local', passwordHash: ownerPassword, name: 'Platform Owner', role: UserRole.SYSTEM_OWNER },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acme-consulting' },
    update: { name: 'Acme Consulting', enabled: true, timezone: 'Asia/Kolkata', email: 'hello@acme.example', phone: '+91 90000 00000' },
    create: { name: 'Acme Consulting', slug: 'acme-consulting', timezone: 'Asia/Kolkata', email: 'hello@acme.example', phone: '+91 90000 00000' },
  });

  await prisma.user.upsert({
    where: { email: 'admin@acme.local' },
    update: { passwordHash: adminPassword, name: 'Acme Admin', role: UserRole.BUSINESS_ADMIN, tenantId: tenant.id },
    create: { email: 'admin@acme.local', passwordHash: adminPassword, name: 'Acme Admin', role: UserRole.BUSINESS_ADMIN, tenantId: tenant.id },
  });

  await prisma.service.upsert({
    where: { id: 'seed-consultation' },
    update: { name: 'Consultation', durationMin: 30, status: ServiceStatus.ACTIVE },
    create: { id: 'seed-consultation', tenantId: tenant.id, name: 'Consultation', description: 'A focused 30-minute consultation.', durationMin: 30, status: ServiceStatus.ACTIVE },
  });

  const rules = [
    [1, '09:00', '17:00'], [2, '09:00', '17:00'], [3, '09:00', '17:00'],
    [4, '09:00', '17:00'], [5, '09:00', '17:00'],
  ] as const;
  for (const [dayOfWeek, startTime, endTime] of rules) {
    const exists = await prisma.availabilityRule.findFirst({ where: { tenantId: tenant.id, dayOfWeek, startTime, endTime } });
    if (!exists) await prisma.availabilityRule.create({ data: { tenantId: tenant.id, dayOfWeek, startTime, endTime } });
  }

  console.log(`Seeded owner ${owner.email} and business admin admin@acme.local`);
}

main().finally(() => prisma.$disconnect());
