import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/serverAuth";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const session = await getServerSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <SignupForm />
    </main>
  );
}
