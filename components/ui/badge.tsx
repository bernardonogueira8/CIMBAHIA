import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "neutral" | "outline";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium tracking-tight rounded transition-colors",
        {
          "bg-[#171A20] text-white": variant === "default",
          "bg-emerald-50 text-emerald-800 border border-emerald-200":
            variant === "success",
          "bg-amber-50 text-amber-800 border border-amber-200":
            variant === "warning",
          "bg-[#FFF0F0] text-[#E82127] border border-[#FCD5D6]":
            variant === "danger",
          "bg-[#F4F4F6] text-[#5C5E62] border border-[#E5E7EB]":
            variant === "neutral",
          "border border-[#D1D5DB] text-[#393C41] bg-white":
            variant === "outline",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
