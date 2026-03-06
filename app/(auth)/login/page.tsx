"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@builderstarot.local");
  const [password, setPassword] = useState("builder123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Invalid credentials");
      setBusy(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <Card className="w-full">
        <CardTitle>Log in</CardTitle>
        <CardDescription className="mt-2">
          Use credentials login for MVP. Demo account is pre-seeded.
        </CardDescription>
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Logging in..." : "Log in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
