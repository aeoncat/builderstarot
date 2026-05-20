import { SiteNav } from "@/components/layout/site-nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <SiteNav />
      <main className="mx-auto w-full max-w-[1160px] px-4 pb-14 pt-10 md:pt-14">{children}</main>
    </div>
  );
}
