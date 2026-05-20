import { cn } from "@/lib/utils";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-[#3d3322] bg-[#15131d] px-2 py-0.5 text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#d0a657]",
        className,
      )}
    >
      {children}
    </span>
  );
}
