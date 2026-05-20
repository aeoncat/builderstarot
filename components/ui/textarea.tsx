import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "gold-focus flex min-h-[120px] w-full rounded-lg border border-[#3d3322] bg-[#0b0a12]/80 px-3 py-2 text-sm text-[#f1eee7] placeholder:text-[#777181]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
