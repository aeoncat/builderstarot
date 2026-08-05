import { prismaAdapter } from "@better-auth/prisma-adapter";
import { compare, hash } from "bcryptjs";
import { betterAuth } from "better-auth";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { buildResetPasswordEmail } from "@/lib/emails/reset-password";

const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
  ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : undefined;
const authBaseURL = process.env.BETTER_AUTH_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;

if (!authSecret) {
  throw new Error("BETTER_AUTH_SECRET is not set. Generate one with `openssl rand -base64 32`.");
}

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
    // Reset links stay valid for 1 hour.
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      const { subject, text, html } = buildResetPasswordEmail({ url, userName: user.name });
      await sendEmail({ to: user.email, subject, text, html });
    },
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
  // Throttle auth endpoints to slow credential brute-forcing.
  // Default window applies to all auth routes; sign-in/sign-up are stricter.
  rateLimit: {
    enabled: true,
    window: 60, // seconds
    max: 100, // requests per window per IP for general auth routes
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/forget-password": { window: 60, max: 3 },
    },
  },
});
