import * as React from "react";

import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "gold-focus h-10 w-full rounded-lg border border-[#3d3322] bg-[#0b0a12]/80 px-3 py-2 text-sm text-[#f1eee7]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";
