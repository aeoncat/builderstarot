"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050509]/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-[#3d3322] bg-[#0f0e18] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.45)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-black text-[#f1eee7]">{title}</h2>
          <button type="button" onClick={onClose} className={cn("gold-focus rounded-md p-1 text-[#9d98a8] hover:bg-[#17151f] hover:text-[#f1eee7]")}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
