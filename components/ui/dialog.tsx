"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = "md",
}: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Dialog Content */}
      <div
        className={cn(
          "relative w-full bg-white border border-[#E5E7EB] rounded shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-150",
          {
            "max-w-sm": maxWidth === "sm",
            "max-w-md": maxWidth === "md",
            "max-w-xl": maxWidth === "lg",
            "max-w-3xl": maxWidth === "xl",
          }
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F1F3]">
          <div>
            <h3 className="text-base font-semibold text-[#171A20] tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[#5C5E62] mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded text-[#5C5E62] hover:text-[#171A20] hover:bg-[#F4F4F6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
