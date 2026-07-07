import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

import { getCardContentByName } from "../lib/card-content";
import { CREATOR_MAJOR_ARCANA, CURRENT_DECK_CARD_NAMES } from "../lib/card-deck";

const prisma = new PrismaClient();

async function syncCreatorMajorArcana() {
  let created = 0;
  let updated = 0;
  let deletedLegacy = 0;
  let retainedLegacy = 0;

  await prisma.$transaction(
    async (tx) => {
      for (const card of CREATOR_MAJOR_ARCANA) {
        // Legacy display columns derive from the rich content registry when
        // available, so DB fallbacks and the card library reflect the same
        // authored text the interpretation engine uses.
        const content = getCardContentByName(card.name);
        const data = {
          arcana: card.arcana,
          suit: null,
          rank: null,
          keywords: JSON.stringify(content ? [...content.keywords] : card.keywords),
          uprightMeaning: content?.upright.meaning ?? card.uprightMeaning,
          reversedMeaning: content?.reversed.meaning ?? card.reversedMeaning,
          promptQuestions: JSON.stringify(
            content ? [...content.upright.questions, ...content.reversed.questions] : card.promptQuestions,
          ),
          imageUrl: card.imageUrl ?? null,
        };

        const existingCards = await tx.card.findMany({
          where: { name: card.name },
          select: { id: true },
        });

        if (existingCards.length === 0) {
          await tx.card.create({
            data: {
              name: card.name,
              ...data,
            },
          });
          created += 1;
          continue;
        }

        await tx.card.updateMany({
          where: { id: { in: existingCards.map((existingCard) => existingCard.id) } },
          data,
        });
        updated += existingCards.length;
      }

      const legacyCards = await tx.card.findMany({
        where: {
          name: { notIn: CURRENT_DECK_CARD_NAMES },
        },
        select: { id: true },
      });

      const legacyCardIds = legacyCards.map((card) => card.id);
      if (legacyCardIds.length === 0) return;

      const journalRefs = await tx.journalEntryCard.findMany({
        where: { cardId: { in: legacyCardIds } },
        select: { cardId: true },
      });
      const spreadRefs = await tx.spreadCard.findMany({
        where: { cardId: { in: legacyCardIds } },
        select: { cardId: true },
      });
      const dailyRefs = await tx.dailyDraw.findMany({
        where: { cardId: { in: legacyCardIds } },
        select: { cardId: true },
      });

      const referencedCardIds = new Set([
        ...journalRefs.map((ref) => ref.cardId),
        ...spreadRefs.map((ref) => ref.cardId),
        ...dailyRefs.map((ref) => ref.cardId),
      ]);
      const deletableCardIds = legacyCardIds.filter((cardId) => !referencedCardIds.has(cardId));

      if (deletableCardIds.length > 0) {
        await tx.favorite.deleteMany({
          where: { cardId: { in: deletableCardIds } },
        });
        await tx.card.deleteMany({
          where: { id: { in: deletableCardIds } },
        });
        deletedLegacy = deletableCardIds.length;
      }

      retainedLegacy = legacyCardIds.length - deletableCardIds.length;
    },
    { timeout: 30000 },
  );

  console.log(
    `Synced creator major arcana: created=${created}, updated=${updated}, deletedLegacy=${deletedLegacy}, retainedReferencedLegacy=${retainedLegacy}.`,
  );
}

async function main() {
  await syncCreatorMajorArcana();

  // Demo user is only seeded outside production and must be explicitly opted in.
  // Never seed a known-credential account against a production database.
  if (process.env.NODE_ENV !== "production" && process.env.SEED_DEMO_USER === "true") {
    const demoEmail = process.env.DEMO_USER_EMAIL ?? "demo@builderstarot.local";
    const demoPassword = process.env.DEMO_USER_PASSWORD;
    if (!demoPassword) {
      console.log("Skipped demo user seeding; set DEMO_USER_PASSWORD to enable.");
    } else {
      const existing = await prisma.user.findUnique({ where: { email: demoEmail } });
      if (!existing) {
        await prisma.user.create({
          data: {
            name: "Demo Builder",
            email: demoEmail,
            emailVerifiedBoolean: true,
            passwordHash: await hash(demoPassword, 12),
          },
        });
        console.log("Seeded demo user.");
      } else {
        console.log("Skipped demo user seeding; user already exists.");
      }
    }
  } else {
    console.log("Skipped demo user seeding (disabled outside opt-in / production).");
  }

  const usersWithLegacyPassword = await prisma.user.findMany({
    where: {
      passwordHash: { not: null },
      email: { not: null },
    },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  let createdCredentialAccounts = 0;
  let updatedCredentialAccounts = 0;

  for (const user of usersWithLegacyPassword) {
    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "credential",
          providerAccountId: user.id,
        },
      },
    });

    if (!account) {
      await prisma.account.create({
        data: {
          userId: user.id,
          type: "credentials",
          provider: "credential",
          providerAccountId: user.id,
          password: user.passwordHash,
        },
      });
      createdCredentialAccounts += 1;
      continue;
    }

    if (!account.password) {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          password: user.passwordHash,
        },
      });
      updatedCredentialAccounts += 1;
    }
  }

  console.log(`Backfilled credential accounts: created=${createdCredentialAccounts}, updated=${updatedCredentialAccounts}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
