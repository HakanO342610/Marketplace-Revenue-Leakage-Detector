const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');

const prisma = new PrismaClient();

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

async function main() {
  const users = await prisma.user.findMany({
    where: { memberships: { none: {} } },
  });

  console.log(`backfilling ${users.length} user(s) with personal orgs...`);

  for (const user of users) {
    const base = user.name || user.email.split('@')[0];
    const orgName = `${base} Workspace`;
    let slug = slugify(`${base}-${randomBytes(3).toString('hex')}`);

    let attempts = 0;
    while (attempts < 5) {
      try {
        const org = await prisma.organization.create({
          data: { name: orgName, slug },
        });
        await prisma.membership.create({
          data: { userId: user.id, orgId: org.id, role: 'admin' },
        });
        const updated = await prisma.uploadRun.updateMany({
          where: { userId: user.id, orgId: null },
          data: { orgId: org.id },
        });
        console.log(`  ${user.email} → org ${org.id} (${updated.count} runs)`);
        break;
      } catch (e) {
        if (e.code === 'P2002') {
          slug = slugify(`${base}-${randomBytes(3).toString('hex')}`);
          attempts++;
        } else {
          throw e;
        }
      }
    }
  }

  console.log('done.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
