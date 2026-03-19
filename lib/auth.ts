import { prismaAdapter } from "@better-auth/prisma-adapter";
import { compare, hash } from "bcryptjs";
import { betterAuth } from "better-auth";

import { prisma } from "@/lib/prisma";

const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
  ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : undefined;
const authBaseURL = process.env.BETTER_AUTH_URL ?? process.env.NEXTAUTH_URL;
const authSecret = process.env.BETTER_AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export const auth = betterAuth({
  appName: "Builder's Tarot",
  baseURL: authBaseURL,
  secret: authSecret,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
    password: {
      hash: async (password) => hash(password, 12),
      verify: async ({ hash: passwordHash, password }) => compare(password, passwordHash),
    },
  },
  user: {
    modelName: "user",
    fields: {
      emailVerified: "emailVerifiedBoolean",
    },
  },
  session: {
    modelName: "session",
    fields: {
      token: "sessionToken",
      expiresAt: "expires",
    },
  },
  account: {
    modelName: "account",
    fields: {
      accountId: "providerAccountId",
      providerId: "provider",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
    },
  },
  verification: {
    modelName: "verificationToken",
    fields: {
      value: "token",
      expiresAt: "expires",
    },
  },
  trustedOrigins,
});
