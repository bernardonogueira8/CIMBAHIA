import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-[#393C41] tracking-tight"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            "w-full h-9 px-3 text-sm text-[#171A20] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#171A20] focus:ring-1 focus:ring-[#171A20] transition-colors disabled:bg-[#F4F4F6] disabled:text-[#9CA3AF] cursor-pointer",
            error && "border-[#E82127]",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-[#E82127]">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
