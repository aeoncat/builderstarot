import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export async function requireUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
