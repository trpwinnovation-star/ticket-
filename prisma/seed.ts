import { PrismaClient, Role, TicketStatus, TicketPriority } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  console.log('🌱 Cleaning existing database records & seeding PostgreSQL Database...');

  // Wipe old records to ensure clean state with Indian users
  await prisma.workLog.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.recommendation.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.user.deleteMany({});
  const demoPassword = hashPassword('password123');

  // Create Default Users
  const priya = await prisma.user.upsert({
    where: { email: 'priya.sharma@acmeretail.com' },
    update: {},
    create: {
      name: 'Priya Sharma',
      email: 'priya.sharma@acmeretail.com',
      role: Role.GUEST_USER,
      password: demoPassword,
      jobTitle: 'Portal Guest / End Customer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const aarav = await prisma.user.upsert({
    where: { email: 'aarav.mehta@itcore.io' },
    update: {},
    create: {
      name: 'Aarav Mehta',
      email: 'aarav.mehta@itcore.io',
      role: Role.IT_SOFTWARE,
      password: demoPassword,
      jobTitle: 'Senior DevOps & Software Specialist',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const rohan = await prisma.user.upsert({
    where: { email: 'rohan.gupta@itcore.io' },
    update: {},
    create: {
      name: 'Rohan Gupta',
      email: 'rohan.gupta@itcore.io',
      role: Role.IT_SOFTWARE,
      password: demoPassword,
      jobTitle: 'Fullstack Systems Engineer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const rajesh = await prisma.user.upsert({
    where: { email: 'rajesh.singhania@orglead.com' },
    update: {},
    create: {
      name: 'Rajesh Singhania',
      email: 'rajesh.singhania@orglead.com',
      role: Role.MANAGER,
      password: demoPassword,
      jobTitle: 'Client Account Manager / Owner',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  const kavita = await prisma.user.upsert({
    where: { email: 'kavita.reddy@platformglobal.org' },
    update: {},
    create: {
      name: 'Kavita Reddy',
      email: 'kavita.reddy@platformglobal.org',
      role: Role.SUPER_ADMIN,
      password: demoPassword,
      jobTitle: 'Global Platform Administrator',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    },
  });

  // Create Subcontractor Teams
  const devOpsTeam = await prisma.team.create({
    data: {
      name: 'Cloud DevOps Subcontractor',
      description: 'Handles server deployments, CI/CD pipelines, database optimization, and infrastructure uptime.',
    },
  });

  const coreTeam = await prisma.team.create({
    data: {
      name: 'Core Application Engineering',
      description: 'Responsible for core software modules, API integrations, billing engines, and UI bug resolution.',
    },
  });

  // Create Sample Ticket
  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-1001',
      title: 'Payment Gateway Timeout during High Traffic Checkout',
      description: 'Customers on our checkout portal experience intermittent 504 Gateway Timeout errors during flash sales.',
      websiteName: 'checkout.acmeretail.com',
      module: 'Billing & Payments',
      category: 'Software Bug',
      priority: TicketPriority.URGENT,
      status: TicketStatus.IN_PROGRESS,
      createdById: priya.id,
      assignedToId: aarav.id,
      teamId: devOpsTeam.id,
      workLogs: {
        create: [
          {
            userId: aarav.id,
            hoursSpent: 3.5,
            description: 'Analyzed server load logs, identified memory leaks in webhook listener.',
          },
        ],
      },
    },
  });

  // Create Sample Recommendation
  await prisma.recommendation.create({
    data: {
      title: 'Dark Mode Toggle & High-Contrast Theme Support',
      description: 'Add a persistent Dark Mode option across the portal dashboard for night shift operations staff.',
      websiteName: 'portal.acmeretail.com',
      moduleName: 'User Profile Settings & Header Bar',
      screenshotUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
      authorId: priya.id,
      upvotes: 24,
    },
  });

  console.log('✅ PostgreSQL Database Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
