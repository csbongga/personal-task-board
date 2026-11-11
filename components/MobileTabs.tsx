"use client";

import { TaskStatus, MOBILE_TABS, STATUS_CONFIG } from "@/lib/types";

export interface MobileTabsProps {
  activeTab: TaskStatus;
  onSelectTab: (status: TaskStatus) => void;
  statusCounts: Record<TaskStatus, number>;
}

export function MobileTabs({
  activeTab,
  onSelectTab,
  statusCounts,
}: MobileTabsProps) {
  return (
    <nav
      aria-label="เลือกสถานะงานบนมือถือ"
      className="block md:hidden w-full rounded-2xl border border-slate-200/90 bg-slate-100/90 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 backdrop-blur-sm"
    >
      <div className="grid grid-cols-5 gap-1" role="tablist">
        {MOBILE_TABS.map((status) => {
          const config = STATUS_CONFIG[status];
          const count = statusCounts[status] ?? 0;
          const isActive = activeTab === status;

          return (
            <button
              key={status}
              type="button"
              role="tab"
              onClick={() => onSelectTab(status)}
              aria-selected={isActive}
              className={`relative flex min-h-[48px] flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-600/30 ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {/* Status color indicator bar when active */}
              {isActive && (
                <span
                  className={`absolute top-1 h-1 w-6 rounded-full ${config.barClass}`}
                />
              )}

              {/* Status mobile label */}
              <span
                className={`truncate text-xs font-semibold ${
                  isActive ? "mt-1.5" : "mt-0"
                }`}
              >
                {config.mobileLabel}
              </span>

              {/* Count badge */}
              <span
                className={`mt-0.5 inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-bold leading-none ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-slate-700 dark:text-white"
                    : "bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileTabs;
