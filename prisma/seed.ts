import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// One demo user per role, per docs/USER_ROLES.md — lets Day 1's manual test
// checklist exercise every role's route guards without hand-provisioning users.
const ROLES: Role[] = [
  "CEO",
  "FINANCE",
  "PPIC",
  "PURCHASING",
  "ACCOUNTING",
  "LOGISTIC",
  "SPV",
  "QS",
  "ADMIN",
];

const SEED_PASSWORD = process.env.SEED_USER_PASSWORD ?? "ChangeMe123!";

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  for (const role of ROLES) {
    const email = `${role.toLowerCase()}@demo.local`;
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role, isActive: true },
      create: {
        name: `${role} Demo User`,
        email,
        passwordHash,
        role,
      },
    });
  }

  console.log(`Seeded ${ROLES.length} demo users (one per role).`);
  console.log(`Login as <role>@demo.local, e.g. ceo@demo.local`);
  console.log(`Password for all seed users: ${SEED_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
