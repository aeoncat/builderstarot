import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[#2f281d] bg-[#0f0e18]/78 p-5 shadow-[inset_0_1px_0_rgba(211,166,82,0.08),0_18px_45px_rgba(0,0,0,0.24)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-display text-lg font-black tracking-normal text-[#f1eee7]", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-6 text-[#9d98a8]", className)} {...props} />;
}
