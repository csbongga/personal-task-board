"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Task,
  Step,
  UpdateTaskInput,
  TaskCategory,
  TaskStatus,
  TaskPriority,
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "@/lib/types";
import { formatThaiDateTime } from "@/lib/utils";
import { StepList } from "@/components/StepList";
import { ThaiDatePicker } from "@/components/ThaiDatePicker";
import {
  X,
  Trash2,
  Calendar,
  AlertTriangle,
  History,
  PartyPopper,
  Clock,
  Tag,
  AlertCircle,
  FileText,
} from "lucide-react";

export interface TaskDetailProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: UpdateTaskInput) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleStep: (task: Task, step: Step, done: boolean) => void;
  onAddStep: (taskId: string, title: string) => void;
  onAddBulkSteps: (taskId: string, titles: string[]) => void;
  onUpdateStepTitle: (taskId: string, stepId: string, title: string) => void;
  onDeleteStep: (taskId: string, stepId: string) => void;
  onReorderSteps: (taskId: string, newSteps: Step[]) => void;
  showCompletePrompt?: boolean;
  onDismissCompletePrompt?: () => void;
}

export function TaskDetail({
  task,
  open,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onToggleStep,
  onAddStep,
  onAddBulkSteps,
  onUpdateStepTitle,
  onDeleteStep,
  onReorderSteps,
  showCompletePrompt,
  onDismissCompletePrompt,
}: TaskDetailProps) {
  // Local form state for auto-save inputs
  const [title, setTitle] = useState("");
  const [waitingFor, setWaitingFor] = useState("");
  const [note, setNote] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [dismissedPrompt, setDismissedPrompt] = useState(false);

  // Sync state whenever task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setWaitingFor(task.waiting_for || "");
      setNote(task.note || "");
      setIsConfirmingDelete(false);
      setDismissedPrompt(false);
    }
  }, [task?.id, task?.updated_at]);

  if (!task) return null;

  // Auto-save handlers
  const handleTitleBlur = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== task.title) {
      onUpdateTask(task.id, { title: trimmed });
    } else {
      setTitle(task.title);
    }
  };

  const handleWaitingForBlur = () => {
    const trimmed = waitingFor.trim();
    const currentVal = task.waiting_for || "";
    if (trimmed !== currentVal) {
      onUpdateTask(task.id, { waiting_for: trimmed || null });
    }
  };

  const handleNoteBlur = () => {
    const currentVal = task.note || "";
    if (note !== currentVal) {
      onUpdateTask(task.id, { note: note || null });
    }
  };

  const handleCategoryChange = (cat: TaskCategory) => {
    if (cat !== task.category) {
      onUpdateTask(task.id, { category: cat });
    }
  };

  const handleStatusChange = (st: TaskStatus) => {
    if (st !== task.status) {
      onUpdateTask(task.id, { status: st });
    }
  };

  const handlePriorityChange = (p: TaskPriority) => {
    if (p !== task.priority) {
      onUpdateTask(task.id, { priority: p });
    }
  };

  // Completion check
  const allStepsDone =
    Boolean(task.steps && task.steps.length > 0 && task.steps.every((s) => s.done));
  const isDone = task.status === "done";
  const shouldPrompt =
    !isDone && !dismissedPrompt && (allStepsDone || showCompletePrompt);

  // Activities sorted newest first
  const sortedActivities = [...(task.activities || [])]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10);

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200" />

        {/* Content: Modal on desktop (md), Full-height sheet on mobile */}
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed z-50 bg-background text-foreground border border-border shadow-2xl transition-all duration-200 outline-none flex flex-col inset-x-0 bottom-0 top-10 rounded-t-2xl md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[90vh] md:rounded-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-border/80 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                  CATEGORY_CONFIG[task.category].badgeClass
                }`}
              >
                {CATEGORY_CONFIG[task.category].label}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                  STATUS_CONFIG[task.status].badgeClass
                }`}
              >
                {STATUS_CONFIG[task.status].label}
              </span>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="ปิดหน้ารายละเอียด"
                className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors -mr-2"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6">
            <Dialog.Title className="sr-only">รายละเอียดงาน: {task.title}</Dialog.Title>

            {/* Completion Prompt Banner */}
            {shouldPrompt && (
              <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-50/90 dark:bg-emerald-950/50 space-y-2.5 shadow-sm animate-in fade-in-50 duration-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <PartyPopper className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                      ทำครบทุกขั้นตอนแล้ว! ย้ายงานนี้ไป &quot;เสร็จแล้ว&quot; ไหม?
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                      ทุกขั้นตอนย่อยในงานนี้เสร็จสมบูรณ์แล้ว คุณสามารถเปลี่ยนสถานะเป็น &quot;เสร็จแล้ว&quot; ได้ทันที
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-11">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateTask(task.id, { status: "done" });
                      setDismissedPrompt(true);
                      onDismissCompletePrompt?.();
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors min-h-[36px]"
                  >
                    ย้ายไป เสร็จแล้ว
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDismissedPrompt(true);
                      onDismissCompletePrompt?.();
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors min-h-[36px]"
                  >
                    ยังไม่ต้อง
                  </button>
                </div>
              </div>
            )}

            {/* Task Title (Inline auto-save) */}
            <div className="space-y-1">
              <label htmlFor="task-title" className="text-xs font-medium text-muted-foreground">
                ชื่องาน
              </label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                className="w-full text-lg sm:text-xl font-bold px-3 py-2 rounded-lg border border-transparent hover:border-input focus:border-primary bg-transparent focus:bg-background transition-colors focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
                placeholder="ระบุชื่องาน..."
              />
            </div>

            {/* Status & Category & Priority & Due Date (Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border/80 bg-muted/20">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>หมวดหมู่งาน</span>
                </label>
                <select
                  value={task.category}
                  onChange={(e) => handleCategoryChange(e.target.value as TaskCategory)}
                  className="w-full text-sm font-medium px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] sm:min-h-[38px]"
                >
                  <option value="article">บทความ</option>
                  <option value="teaching">เอกสารคำสอน/ตำรา</option>
                  <option value="research">วิจัย</option>
                  <option value="advising">ที่ปรึกษา</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>สถานะงาน</span>
                </label>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                  className="w-full text-sm font-medium px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] sm:min-h-[38px]"
                >
                  <option value="doing">กำลังทำ</option>
                  <option value="polish">ปรับปรุง</option>
                  <option value="waiting">รอผล</option>
                  <option value="todo">ยังไม่เริ่ม</option>
                  <option value="done">เสร็จแล้ว</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>ความสำคัญ</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([1, 2, 3] as TaskPriority[]).map((p) => {
                    const isSelected = task.priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePriorityChange(p)}
                        className={`text-xs font-medium py-2 rounded-lg border transition-all min-h-[44px] sm:min-h-[38px] flex items-center justify-center ${
                          isSelected
                            ? p === 1
                              ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                              : p === 2
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-slate-700 text-white border-slate-700 shadow-sm"
                            : "bg-background border-input text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {PRIORITY_CONFIG[p].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>วันครบกำหนด</span>
                </label>
                <ThaiDatePicker
                  value={task.due_date}
                  onChange={(iso) => onUpdateTask(task.id, { due_date: iso })}
                />
              </div>
            </div>

            {/* Waiting For Box (Prominent when status === 'waiting') */}
            {task.status === "waiting" && (
              <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/5 space-y-2 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <label htmlFor="waiting-for-input" className="text-xs font-semibold">
                    รออะไร / รอใคร (กำลังรอผล):
                  </label>
                </div>
                <input
                  id="waiting-for-input"
                  type="text"
                  value={waitingFor}
                  onChange={(e) => setWaitingFor(e.target.value)}
                  onBlur={handleWaitingForBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  placeholder="เช่น รอผู้ทรงพิจารณา, รอลายเซ็นหนังสือรับรองงวด 3..."
                  className="w-full text-sm px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px] sm:min-h-[38px]"
                />
              </div>
            )}

            {/* Step List Section */}
            <div className="space-y-3 pt-2">
              <StepList
                taskId={task.id}
                steps={task.steps || []}
                onToggleStep={(step, done) => onToggleStep(task, step, done)}
                onAddStep={(stepTitle) => onAddStep(task.id, stepTitle)}
                onAddBulkSteps={(stepTitles) => onAddBulkSteps(task.id, stepTitles)}
                onUpdateStepTitle={(stepId, stepTitle) =>
                  onUpdateStepTitle(task.id, stepId, stepTitle)
                }
                onDeleteStep={(stepId) => onDeleteStep(task.id, stepId)}
                onReorderSteps={(newSteps) => onReorderSteps(task.id, newSteps)}
              />
            </div>

            {/* Note Section (Freeform) */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <label htmlFor="task-note-textarea" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>บันทึกเพิ่มเติม (Note)</span>
              </label>
              <textarea
                id="task-note-textarea"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={handleNoteBlur}
                placeholder="จดบันทึกลิ้งก์งาน รายละเอียด หรือข้อคิดเห็นเพิ่มเติมที่นี่ (บันทึกอัตโนมัติ)..."
                className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
              />
            </div>

            {/* Activity History */}
            <div className="space-y-2.5 pt-2 border-t border-border/60">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>ประวัติกิจกรรมล่าสุด (10 รายการ)</span>
              </span>

              {sortedActivities.length > 0 ? (
                <div className="space-y-2 pl-2 border-l-2 border-border/70 ml-1">
                  {sortedActivities.map((act) => (
                    <div key={act.id} className="text-xs space-y-0.5">
                      <p className="text-foreground font-medium">{act.message}</p>
                      <p className="text-muted-foreground text-[11px]">
                        {formatThaiDateTime(act.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">ยังไม่มีประวัติกิจกรรม</p>
              )}
            </div>

            {/* Delete Task Section */}
            <div className="pt-4 border-t border-border/60">
              {!isConfirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 py-1.5 px-2.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบงานนี้...</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/40 space-y-2.5 animate-in fade-in-50 duration-200">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>ยืนยันการลบงานนี้?</span>
                  </div>
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    ข้อมูลงานและขั้นตอนย่อยทั้งหมดจะถูกลบถาวร ไม่สามารถกู้คืนได้
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteTask(task.id);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors min-h-[36px]"
                    >
                      ยืนยันลบ
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors min-h-[36px]"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
