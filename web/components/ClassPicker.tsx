"use client";

import { useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { COCO_CLASSES } from "@/constants/cocoClasses";

interface ClassPickerProps {
  value: string;
  onChange: (cls: string) => void;
  disabled?: boolean;
}

export function ClassPicker({ value, onChange, disabled }: ClassPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = COCO_CLASSES.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <span className={value ? "" : "text-slate-400"}>
          {value || "Select a class to find…"}
        </span>
        <ChevronDown size={18} className="text-slate-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 max-h-72 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
              <Search size={16} className="text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search COCO classes…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="max-h-56 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="capitalize">{c}</span>
                  {value === c && <Check size={16} className="text-brand" />}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-3 text-sm text-slate-400">No matches</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ClassPicker;
