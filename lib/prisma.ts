import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const databaseUrl = process.env.DATABASE_URL ?? "";

if (process.env.VERCEL && databaseUrl.startsWith("file:")) {
  throw new Error("Invalid DATABASE_URL for Vercel: SQLite (file:) is not supported. Use a hosted Postgres URL.");
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
