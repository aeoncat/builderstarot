"use client";

import Link from "next/link";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { toAuthErrorMessage } from "@/lib/auth-error-message";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setBusy(true);
    try {
      const { error: resetError } = await authClient.requestPasswordReset({
        email: normalizedEmail,
        redirectTo: "/reset-password",
      });

      if (resetError) {
        setError(toAuthErrorMessage(resetError, "Unable to send the reset email right now."));
        return;
      }

      // Always show success regardless of whether the email exists, so the
      // form can't be used to probe which addresses have accounts.
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Card className="w-full">
        <CardTitle>Check your email</CardTitle>
        <CardDescription className="mt-2">
          If an account exists for that address, we&rsquo;ve sent a link to reset your password. The link
          expires in 1 hour.
        </CardDescription>
        <p className="mt-4 text-sm text-[#9d98a8]">
          Back to{" "}
          <Link className="text-[#d0a657] hover:text-[#e0bc72]" href="/login">
            log in
          </Link>
          .
        </p>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardTitle>Reset your password</CardTitle>
      <CardDescription className="mt-2">
        Enter your email and we&rsquo;ll send you a link to set a new password.
      </CardDescription>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Sending..." : "Send reset link"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-[#9d98a8]">
        Remembered it?{" "}
        <Link className="text-[#d0a657] hover:text-[#e0bc72]" href="/login">
          Log in
        </Link>
        .
      </p>
    </Card>
  );
}
