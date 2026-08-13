"use client";

import { useState } from "react";
import { Search, X, Check, Sparkles } from "lucide-react";
import { COCO_CLASSES } from "@/constants/cocoClasses";

interface ClassPickerProps {
  value: string;
  onChange: (cls: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const POPULAR_TAGS = [
  { label: "All Objects", value: "" },
  { label: "Person / Player", value: "person" },
  { label: "Sports Ball", value: "sports ball" },
  { label: "Car / Vehicle", value: "car" },
  { label: "Cup / Drink", value: "cup" },
  { label: "Chair / Seat", value: "chair" },
  { label: "Bottle", value: "bottle" },
  { label: "Backpack / Bag", value: "backpack" },
];

export function ClassPicker({
  value,
  onChange,
  disabled,
  placeholder = "Type any object name to search (e.g. player, ball, car, dog, chair)...",
}: ClassPickerProps) {
  const [openSuggestions, setOpenSuggestions] = useState(false);

  const filtered = COCO_CLASSES.filter((c) =>
    c.toLowerCase().includes((value || "").toLowerCase())
  ).slice(0, 8);

  return (
    <div className="space-y-2.5">
      {/* Search Input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpenSuggestions(true);
          }}
          onFocus={() => setOpenSuggestions(true)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-xs font-semibold text-slate-900 shadow-sm outline-none transition focus:border-violet-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpenSuggestions(false);
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={15} />
          </button>
        )}

        {/* Dropdown Suggestions */}
        {openSuggestions && filtered.length > 0 && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpenSuggestions(false)}
            />
            <div className="absolute z-20 mt-1.5 max-h-52 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Suggested Matching Classes
              </div>
              {filtered.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    onChange(c);
                    setOpenSuggestions(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-700 dark:text-slate-300 dark:hover:bg-violet-950/40 dark:hover:text-violet-300"
                >
                  <span className="capitalize">{c}</span>
                  {value.toLowerCase() === c.toLowerCase() && (
                    <Check size={14} className="text-violet-600" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Quick Suggestion Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-slate-400">Quick Filters:</span>
        {POPULAR_TAGS.map((tag) => {
          const isSelected = value.toLowerCase() === tag.value.toLowerCase();
          return (
            <button
              key={tag.label}
              type="button"
              onClick={() => onChange(tag.value)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                isSelected
                  ? "bg-violet-600 text-white shadow-sm"
                  : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ClassPicker;
