import Link from "next/link";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "./reset-password-form";

type SearchParams = {
  token?: string;
  error?: string;
};

export default function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const token = searchParams.token;
  const invalid = Boolean(searchParams.error) || !token;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      {invalid ? (
        <Card className="w-full">
          <CardTitle>Link expired or invalid</CardTitle>
          <CardDescription className="mt-2">
            This password-reset link is no longer valid. Reset links expire after 1 hour and can only be
            used once.
          </CardDescription>
          <p className="mt-4 text-sm text-[#9d98a8]">
            <Link className="text-[#d0a657] hover:text-[#e0bc72]" href="/forgot-password">
              Request a new link
            </Link>
            .
          </p>
        </Card>
      ) : (
        <ResetPasswordForm token={token as string} />
      )}
    </main>
  );
}
