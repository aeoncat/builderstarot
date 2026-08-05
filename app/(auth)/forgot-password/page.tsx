import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/serverAuth";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage() {
  const session = await getServerSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <ForgotPasswordForm />
    </main>
  );
}
