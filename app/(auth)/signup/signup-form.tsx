"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { toAuthErrorMessage } from "@/lib/auth-error-message";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      setError("Please fill in name, email, and password.");
      return;
    }

    if (normalizedPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name: normalizedName,
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (signUpError) {
        setError(toAuthErrorMessage(signUpError, "Unable to create account right now."));
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
      <CardTitle>Create account</CardTitle>
      <CardDescription className="mt-2">Sign up with email and password.</CardDescription>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          autoComplete="name"
          placeholder="Your name"
          required
        />
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{" "}
        <Link className="text-indigo-500 hover:text-indigo-400" href="/login">
          Log in
        </Link>
        .
      </p>
    </Card>
  );
}
