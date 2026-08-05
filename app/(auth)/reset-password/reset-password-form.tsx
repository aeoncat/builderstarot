"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { toAuthErrorMessage } from "@/lib/auth-error-message";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (resetError) {
        setError(toAuthErrorMessage(resetError, "Unable to reset your password. The link may have expired."));
        return;
      }

      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Card className="w-full">
        <CardTitle>Password updated</CardTitle>
        <CardDescription className="mt-2">
          Your password has been changed. You can now log in with your new password.
        </CardDescription>
        <Button className="mt-4 w-full" onClick={() => router.push("/login")}>
          Go to login
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardTitle>Choose a new password</CardTitle>
      <CardDescription className="mt-2">Enter a new password for your account.</CardDescription>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="new-password"
          placeholder="New password (at least 8 characters)"
          required
        />
        <Input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          type="password"
          autoComplete="new-password"
          placeholder="Confirm new password"
          required
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Updating..." : "Update password"}
        </Button>
      </form>
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
