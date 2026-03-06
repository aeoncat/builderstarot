import type { Metadata } from "next";
import localFont from "next/font/local";

import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const headingFont = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-heading",
  weight: "100 900",
});

const bodyFont = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-body",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Builder's Tarot",
  description: "A cozy-futurist tarot app for builders and creators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${headingFont.variable} ${bodyFont.variable} min-h-screen bg-background font-body text-foreground antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
