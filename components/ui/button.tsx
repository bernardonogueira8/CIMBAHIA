import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171A20] focus-visible:ring-offset-1 disabled:opacity-40 disabled:pointer-events-none select-none",
          // Tesla style minimal rounded corners
          "rounded",
          {
            // Primary (Midnight Core)
            "bg-[#171A20] text-white hover:bg-[#282C34] active:bg-[#000000] shadow-sm":
              variant === "primary",
            // Secondary (Surface Gray)
            "bg-[#EEEEEE] text-[#171A20] hover:bg-[#E2E4E8] active:bg-[#D5D8DE]":
              variant === "secondary",
            // Outline (Graphite border)
            "border border-[#D1D5DB] bg-white text-[#171A20] hover:bg-[#F9FAFB] active:bg-[#F3F4F6]":
              variant === "outline",
            // Danger (Tesla Brand Red)
            "bg-[#E82127] text-white hover:bg-[#C91A20] active:bg-[#A8151A] shadow-sm":
              variant === "danger",
            // Ghost
            "text-[#5C5E62] hover:text-[#171A20] hover:bg-[#F4F4F6]":
              variant === "ghost",
          },
          {
            "h-8 px-3 text-xs gap-1.5": size === "sm",
            "h-9 px-4 text-sm gap-2": size === "md",
            "h-11 px-6 text-base gap-2.5": size === "lg",
            "h-9 w-9 p-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
