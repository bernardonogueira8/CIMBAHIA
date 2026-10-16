import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[#393C41] tracking-tight"
          >
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            "w-full min-h-[80px] p-3 text-sm text-[#171A20] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#171A20] focus:ring-1 focus:ring-[#171A20] transition-colors placeholder:text-[#9CA3AF] disabled:bg-[#F4F4F6] disabled:text-[#9CA3AF]",
            error && "border-[#E82127] focus:border-[#E82127]",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#E82127]">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
