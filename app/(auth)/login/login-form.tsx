"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { toAuthErrorMessage } from "@/lib/auth-error-message";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setBusy(true);
    try {
      const { error: signInError } = await authClient.signIn.email({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        setError(toAuthErrorMessage(signInError, "Unable to sign in right now."));
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full">
      <CardTitle>Log in</CardTitle>
      <CardDescription className="mt-2">Sign in with your email and password.</CardDescription>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          required
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Logging in..." : "Log in"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        No account yet?{" "}
        <Link className="text-indigo-500 hover:text-indigo-400" href="/signup">
          Create one
        </Link>
        .
      </p>
    </Card>
  );
}
