"use client";

import { useMemo } from "react";
import { Task } from "@/lib/types";
import { getDueDateStatus, formatThaiDate } from "@/lib/utils";
import { PlayCircle, Sparkles, Clock, CheckCircle2, AlertTriangle, CalendarClock } from "lucide-react";

export interface SummaryBarProps {
  tasks: Task[];
}

export function SummaryBar({ tasks }: SummaryBarProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const doingCount = tasks.filter((t) => t.status === "doing").length;
    const polishCount = tasks.filter((t) => t.status === "polish").length;
    const waitingCount = tasks.filter((t) => t.status === "waiting").length;

    const doneThisMonthCount = tasks.filter((t) => {
      if (t.status !== "done") return false;
      const d = new Date(t.updated_at || t.created_at);
      return (
        !isNaN(d.getTime()) &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      );
    }).length;

    const overdueTasks = tasks.filter(
      (t) => t.status !== "done" && getDueDateStatus(t.due_date, t.status) === "overdue"
    );

    const soonTasks = tasks.filter(
      (t) => t.status !== "done" && getDueDateStatus(t.due_date, t.status) === "soon"
    );

    return {
      doingCount,
      polishCount,
      waitingCount,
      doneThisMonthCount,
      overdueTasks,
      soonTasks,
    };
  }, [tasks]);

  return (
    <div className="space-y-3">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
        {/* Doing */}
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200/80 bg-white p-3.5 shadow-sm transition hover:shadow-md dark:border-blue-900/50 dark:bg-slate-900">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
            <PlayCircle className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
              กำลังทำ
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400 sm:text-2xl">
                {stats.doingCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">งาน</span>
            </div>
          </div>
        </div>

        {/* Polish */}
        <div className="flex items-center gap-3 rounded-2xl border border-teal-200/80 bg-white p-3.5 shadow-sm transition hover:shadow-md dark:border-teal-900/50 dark:bg-slate-900">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-950/80 dark:text-teal-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
              ปรับปรุง
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight text-teal-600 dark:text-teal-400 sm:text-2xl">
                {stats.polishCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">งาน</span>
            </div>
          </div>
        </div>

        {/* Waiting */}
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200/80 bg-white p-3.5 shadow-sm transition hover:shadow-md dark:border-amber-900/50 dark:bg-slate-900">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400">
            <Clock className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
              รอผล
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400 sm:text-2xl">
                {stats.waitingCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">งาน</span>
            </div>
          </div>
        </div>

        {/* Done this month */}
        <div className="flex items-center gap-3 rounded-2xl border border-green-200/80 bg-white p-3.5 shadow-sm transition hover:shadow-md dark:border-green-900/50 dark:bg-slate-900">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-950/80 dark:text-green-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
              เสร็จเดือนนี้
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight text-green-600 dark:text-green-400 sm:text-2xl">
                {stats.doneThisMonthCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">งาน</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Alerts */}
      {stats.overdueTasks.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-300 bg-rose-50/90 p-3.5 text-rose-900 shadow-sm dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-rose-700 dark:text-rose-300">
                เลยกำหนดส่ง {stats.overdueTasks.length} งาน:
              </span>
              <span className="text-sm">
                {stats.overdueTasks.map((t, idx) => (
                  <span key={t.id}>
                    {idx > 0 && " • "}
                    <span className="font-medium">{t.title}</span>
                    {t.due_date && (
                      <span className="text-xs opacity-80">
                        {" "}(ครบ {formatThaiDate(t.due_date)})
                      </span>
                    )}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Due Soon Alerts */}
      {stats.soonTasks.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-amber-900 shadow-sm dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200">
          <CalendarClock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-amber-700 dark:text-amber-300">
                ใกล้ครบกำหนดภายใน 7 วัน ({stats.soonTasks.length} งาน):
              </span>
              <span className="text-sm">
                {stats.soonTasks.map((t, idx) => (
                  <span key={t.id}>
                    {idx > 0 && " • "}
                    <span className="font-medium">{t.title}</span>
                    {t.due_date && (
                      <span className="text-xs opacity-80">
                        {" "}(ครบ {formatThaiDate(t.due_date)})
                      </span>
                    )}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SummaryBar;
