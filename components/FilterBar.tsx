"use client";

import { TaskCategory, CATEGORY_CONFIG } from "@/lib/types";
import { Search, X } from "lucide-react";

export interface FilterBarProps {
  selectedCategory: TaskCategory | "all";
  onSelectCategory: (category: TaskCategory | "all") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryCounts: Record<TaskCategory | "all", number>;
}

interface CategoryOption {
  key: TaskCategory | "all";
  label: string;
  dotClass?: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { key: "all", label: "ทั้งหมด" },
  {
    key: "article",
    label: CATEGORY_CONFIG.article.shortLabel,
    dotClass: CATEGORY_CONFIG.article.dotClass,
  },
  {
    key: "teaching",
    label: CATEGORY_CONFIG.teaching.shortLabel,
    dotClass: CATEGORY_CONFIG.teaching.dotClass,
  },
  {
    key: "research",
    label: CATEGORY_CONFIG.research.shortLabel,
    dotClass: CATEGORY_CONFIG.research.dotClass,
  },
  {
    key: "advising",
    label: CATEGORY_CONFIG.advising.shortLabel,
    dotClass: "bg-[#F97316]",
  },
  {
    key: "other",
    label: CATEGORY_CONFIG.other.shortLabel,
    dotClass: CATEGORY_CONFIG.other.dotClass,
  },
];

export function FilterBar({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  categoryCounts,
}: FilterBarProps) {
  return (
    <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {CATEGORY_OPTIONS.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          const count = categoryCounts[cat.key] ?? 0;

          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelectCategory(cat.key)}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-600/40 active:scale-95 ${
                isSelected
                  ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              {cat.dotClass && (
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${cat.dotClass}`}
                />
              )}
              <span>{cat.label}</span>
              <span
                className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-72 md:w-80">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ค้นหาชื่องาน..."
          className="block w-full min-h-[44px] rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="ล้างคำค้นหา"
            title="ล้างคำค้นหา"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default FilterBar;
