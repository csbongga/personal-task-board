"use client";

import { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Task,
  Step,
  TaskStatus,
  CATEGORY_CONFIG,
  STATUS_CONFIG,
} from "@/lib/types";
import { formatThaiDate, getDueDateStatus } from "@/lib/utils";
import {
  MoreHorizontal,
  Check,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  GripVertical,
} from "lucide-react";

export interface TaskCardProps {
  task: Task;
  onOpenDetail: (task: Task) => void;
  onToggleNextStep: (task: Task, step: Step) => void;
  onMoveStatus: (task: Task, newStatus: TaskStatus) => void;
  isSortable?: boolean;
}

const ALL_STATUSES: TaskStatus[] = [
  "doing",
  "polish",
  "waiting",
  "todo",
  "done",
];

export function TaskCard({
  task,
  onOpenDetail,
  onToggleNextStep,
  onMoveStatus,
  isSortable = true,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
    disabled: !isSortable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const categoryConf = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.other;

  // Sorted steps and next pending step
  const { sortedSteps, nextStep, totalSteps, doneCount, percent } =
    useMemo(() => {
      const steps = [...(task.steps || [])].sort(
        (a, b) => a.position - b.position
      );
      const next = steps.find((s) => !s.done);
      const total = steps.length;
      const done = steps.filter((s) => s.done).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        sortedSteps: steps,
        nextStep: next,
        totalSteps: total,
        doneCount: done,
        percent: pct,
      };
    }, [task.steps]);

  // Due date status
  const dueStatus = getDueDateStatus(task.due_date, task.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onOpenDetail(task)}
      className={`group relative rounded-2xl p-4 text-left shadow-sm transition-all hover:shadow-md cursor-pointer ${
        categoryConf.cardClass
      } ${
        isDragging
          ? "opacity-30 ring-2 ring-blue-500 shadow-xl"
          : "hover:brightness-[0.98] dark:hover:brightness-110"
      }`}
    >
      {/* Top Bar: Category badge, Priority, Drag handle, and Menu */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Category Badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-medium ${categoryConf.badgeClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${categoryConf.dotClass}`} />
            {categoryConf.label}
          </span>

          {/* High Priority Badge */}
          {task.priority === 1 && (
            <span className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:border-rose-900/80 dark:bg-rose-950/60 dark:text-rose-300">
              ด่วน/สำคัญสูง
            </span>
          )}
        </div>

        {/* Action Controls: Drag Handle + Move Menu */}
        <div className="flex items-center gap-0.5">
          {/* Drag Handle for desktop/touch */}
          {isSortable && (
            <div
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              className="flex min-h-[44px] min-w-[36px] cursor-grab items-center justify-center text-slate-300 hover:text-slate-600 active:cursor-grabbing dark:text-slate-600 dark:hover:text-slate-300"
              title="ลากเพื่อเปลี่ยนลำดับหรือสถานะ"
              aria-label="ลากเพื่อเปลี่ยนลำดับ"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}

          {/* Move Status Dropdown Menu (Crucial for mobile!) */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="เปลี่ยนสถานะงาน"
                title="เปลี่ยนสถานะงาน"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                className="z-50 min-w-[190px] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu.Label className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  ย้ายไปสถานะ...
                </DropdownMenu.Label>
                {ALL_STATUSES.map((st) => {
                  const conf = STATUS_CONFIG[st];
                  const isCurrent = task.status === st;

                  return (
                    <DropdownMenu.Item
                      key={st}
                      disabled={isCurrent}
                      onSelect={() => onMoveStatus(task, st)}
                      className={`flex min-h-[42px] cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium outline-none transition ${
                        isCurrent
                          ? "bg-slate-100 font-bold text-slate-400 dark:bg-slate-800/60 dark:text-slate-500 cursor-not-allowed"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${conf.dotClass}`} />
                      <span className="flex-1">{conf.label}</span>
                      {isCurrent && (
                        <span className="text-xs text-slate-400">(ปัจจุบัน)</span>
                      )}
                    </DropdownMenu.Item>
                  );
                })}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Task Title */}
      <h3 className="mt-2 text-[15px] sm:text-base font-bold leading-snug text-slate-900 dark:text-slate-100 line-clamp-2">
        {task.title}
      </h3>

      {/* Prominent Next Action / Waiting Box */}
      <div className="mt-3">
        {task.status === "waiting" ? (
          <div className="rounded-xl border border-amber-300/80 bg-white/95 dark:bg-slate-900/90 p-3 text-amber-950 dark:border-amber-900/60 dark:text-amber-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>รอผล / ค้างพิจารณา</span>
            </div>
            <div className="mt-1 text-sm font-bold leading-tight">
              ⏳ {task.waiting_for || "รอผลพิจารณา"}
            </div>
          </div>
        ) : nextStep ? (
          <div className="group/step relative rounded-xl border border-slate-200/90 bg-white p-3 text-slate-950 shadow-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                ขั้นตอนถัดไป
              </span>
              <span className="text-[11px] opacity-75">ติ๊กเสร็จได้ทันที</span>
            </div>
            <div className="mt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleNextStep(task, nextStep);
                }}
                className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border-2 border-blue-500 bg-slate-50 text-transparent shadow-sm transition hover:scale-105 hover:bg-blue-600 hover:text-white dark:border-blue-400 dark:bg-slate-800 dark:hover:bg-blue-600"
                title={`คลิกเพื่อเช็คว่า "${nextStep.title}" เสร็จแล้ว`}
                aria-label={`คลิกเพื่อเช็คว่า ${nextStep.title} เสร็จแล้ว`}
              >
                <Check className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight text-slate-900 dark:text-white">
                  ▶ {nextStep.title}
                </p>
              </div>
            </div>
          </div>
        ) : totalSteps > 0 && doneCount === totalSteps ? (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-white/95 dark:bg-slate-900/90 p-2.5 text-xs font-semibold text-green-700 dark:border-green-900/50 dark:text-green-300 shadow-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
            <span>✓ ครบทุกขั้นตอนแล้ว</span>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300/80 bg-white/60 dark:bg-slate-900/60 p-2.5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            ยังไม่ได้ระบุขั้นตอนย่อย
          </div>
        )}
      </div>

      {/* Progress Bar (if steps exist) */}
      {totalSteps > 0 && (
        <div className="mt-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>ความคืบหน้า</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {doneCount}/{totalSteps} ขั้นตอน ({percent}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                percent === 100
                  ? "bg-green-500"
                  : percent > 50
                  ? "bg-blue-600"
                  : "bg-blue-500"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Info: Due Date & Note indicator */}
      {(task.due_date || task.note) && (
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-2.5 text-xs dark:border-slate-800/80">
          {/* Due date badge */}
          {task.due_date ? (
            <div
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-medium ${
                dueStatus === "overdue"
                  ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
                  : dueStatus === "soon"
                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300"
                  : "border-slate-200 bg-white/90 text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400"
              }`}
            >
              {dueStatus === "overdue" ? (
                <AlertCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              ) : dueStatus === "soon" ? (
                <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
              )}
              <span>
                {dueStatus === "overdue" ? "เลยกำหนด " : dueStatus === "soon" ? "ใกล้ครบ " : "ครบ "}
                {formatThaiDate(task.due_date)}
              </span>
            </div>
          ) : (
            <div />
          )}

          {/* Note indicator */}
          {task.note && (
            <div
              className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              title={task.note}
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="text-[11px] truncate max-w-[120px]">มีบันทึก</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TaskCard;
