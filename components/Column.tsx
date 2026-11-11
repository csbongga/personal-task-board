"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task, Step, TaskStatus, STATUS_CONFIG } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";

export interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onOpenDetail: (task: Task) => void;
  onToggleNextStep: (task: Task, step: Step) => void;
  onMoveStatus: (task: Task, newStatus: TaskStatus) => void;
  defaultCollapsed?: boolean;
}

export function Column({
  status,
  tasks,
  onOpenDetail,
  onToggleNextStep,
  onMoveStatus,
  defaultCollapsed,
}: ColumnProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof defaultCollapsed === "boolean") return defaultCollapsed;
    return status === "done";
  });

  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: "Column",
      status,
    },
  });

  const config = STATUS_CONFIG[status];
  const taskIds = tasks.map((t) => t.id);

  // If collapsed (especially for "done" column)
  if (isCollapsed) {
    return (
      <div
        ref={setNodeRef}
        data-status={status}
        className={`relative flex w-14 shrink-0 flex-col items-center rounded-2xl border bg-slate-100/90 py-4 transition-all dark:bg-slate-900/60 ${
          isOver
            ? "border-blue-500 ring-2 ring-blue-500/50 bg-blue-50/40 dark:bg-blue-950/40"
            : "border-slate-200/90 dark:border-slate-800"
        }`}
        title={`คลิกเพื่อกางคอลัมน์ "${config.label}"`}
      >
        {/* Expand button */}
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:text-slate-800 shadow-sm transition dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label={`กางคอลัมน์ ${config.label}`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Count Badge */}
        <div className="mt-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {tasks.length}
        </div>

        {/* Vertical Text Label */}
        <div
          onClick={() => setIsCollapsed(false)}
          className="mt-6 flex flex-1 cursor-pointer select-none items-center justify-center text-xs font-semibold tracking-wider text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 [writing-mode:vertical-rl]"
        >
          <span className="flex items-center gap-1.5 rotate-180">
            {status === "done" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {config.label}
          </span>
        </div>
      </div>
    );
  }

  // Expanded Column
  return (
    <div
      ref={setNodeRef}
      data-status={status}
      className={`flex w-[300px] shrink-0 flex-col rounded-2xl border bg-slate-100/70 p-3 transition-colors dark:bg-slate-900/40 ${
        config.headerClass
      } ${
        isOver
          ? "border-blue-500 ring-2 ring-blue-500/40 bg-blue-50/30 dark:bg-blue-950/30"
          : "border-slate-200/80 dark:border-slate-800"
      }`}
    >
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${config.dotClass}`} />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {config.label}
          </h2>
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {tasks.length}
          </span>
        </div>

        {/* Collapse toggle (only for "done" column or collapsible) */}
        {status === "done" && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:text-slate-500 dark:hover:text-slate-300"
            title="พับเก็บคอลัมน์"
            aria-label="พับเก็บคอลัมน์เสร็จแล้ว"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Task List (Sortable Area) */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="custom-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto min-h-[380px] max-h-[calc(100vh-230px)] pr-0.5 pb-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpenDetail={onOpenDetail}
              onToggleNextStep={onToggleNextStep}
              onMoveStatus={onMoveStatus}
            />
          ))}

          {tasks.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300/80 p-6 text-center dark:border-slate-800">
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                ไม่มีงานในสถานะนี้
              </p>
              <p className="mt-1 text-[11px] text-slate-400/80 dark:text-slate-600">
                ลากงานมาวางที่นี่ได้
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default Column;
