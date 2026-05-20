import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn(
          "gold-focus flex h-10 w-full rounded-lg border border-[#3d3322] bg-[#0b0a12]/80 px-3 py-2 text-sm text-[#f1eee7] placeholder:text-[#777181]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
