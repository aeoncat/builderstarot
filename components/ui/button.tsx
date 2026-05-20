import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "gold-focus inline-flex items-center justify-center rounded-lg text-sm font-black tracking-normal transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#d0a657] text-[#090810] shadow-[0_14px_32px_rgba(208,166,87,0.18)] hover:bg-[#e0bc72]",
        secondary: "border border-[#3d3322] bg-[#17151f] text-[#f0ece5] hover:bg-[#211e2b]",
        ghost: "text-[#c8c2d0] hover:bg-[#17151f] hover:text-[#f0ece5]",
        outline: "border border-[#3d3322] bg-transparent text-[#d5cfda] hover:border-[#d0a657]/55 hover:bg-[#17151f]",
        destructive: "bg-rose-600 text-white hover:bg-rose-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
