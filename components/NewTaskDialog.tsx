"use client";

import React, { useState, useEffect, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CreateTaskInput,
  TaskCategory,
  TaskStatus,
  TaskPriority,
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "@/lib/types";
import {
  ARTICLE_TEMPLATE_STEPS,
  ADVISING_TEMPLATE_STEPS,
  REVIEW_TEMPLATE_STEPS,
  generateTeachingSteps,
  StepTemplateType,
} from "@/lib/templates";
import { ThaiDatePicker } from "@/components/ThaiDatePicker";
import {
  X,
  Plus,
  Layers,
  Sparkles,
  AlertTriangle,
  Clock,
  Tag,
  AlertCircle,
  Calendar,
  Loader2,
} from "lucide-react";

export interface NewTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateTask: (input: CreateTaskInput) => Promise<void>;
}

export function NewTaskDialog({
  open,
  onClose,
  onCreateTask,
}: NewTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("article");
  const [status, setStatus] = useState<TaskStatus>("doing");
  const [waitingFor, setWaitingFor] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(2);
  const [dueDate, setDueDate] = useState("");
  const [templateType, setTemplateType] = useState<StepTemplateType>("article");
  const [chapterCount, setChapterCount] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // When dialog opens or resets, reset form
  useEffect(() => {
    if (open) {
      setTitle("");
      setCategory("article");
      setStatus("doing");
      setWaitingFor("");
      setPriority(2);
      setDueDate("");
      setTemplateType("article");
      setChapterCount(15);
      setIsSubmitting(false);
      setErrorMessage("");
    }
  }, [open]);

  // When user changes category, suggest corresponding template
  const handleCategoryChange = (newCat: TaskCategory) => {
    setCategory(newCat);
    switch (newCat) {
      case "article":
        setTemplateType("article");
        break;
      case "teaching":
        setTemplateType("teaching");
        break;
      case "advising":
        setTemplateType("advising");
        break;
      case "review":
        setTemplateType("review");
        break;
      case "research":
        setTemplateType("research");
        break;
      case "other":
      default:
        setTemplateType("empty");
        break;
    }
  };

  // Compute preview of initial steps
  const previewSteps = useMemo(() => {
    switch (templateType) {
      case "article":
        return [...ARTICLE_TEMPLATE_STEPS];
      case "teaching":
        return generateTeachingSteps(chapterCount || 15);
      case "advising":
        return [...ADVISING_TEMPLATE_STEPS];
      case "review":
        return [...REVIEW_TEMPLATE_STEPS];
      case "research":
      case "empty":
      default:
        return [];
    }
  }, [templateType, chapterCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage("กรุณาระบุชื่องาน");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const input: CreateTaskInput = {
        title: trimmedTitle,
        category,
        status,
        waiting_for: status === "waiting" && waitingFor.trim() ? waitingFor.trim() : null,
        priority,
        due_date: dueDate ? dueDate : null,
        initialSteps: previewSteps,
      };

      await onCreateTask(input);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการสร้างงาน";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200" />

        {/* Content Modal */}
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed z-50 bg-background text-foreground border border-border shadow-2xl transition-all duration-200 outline-none flex flex-col inset-x-0 bottom-0 top-10 rounded-t-2xl md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-xl md:max-h-[90vh] md:rounded-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <Dialog.Title className="text-base sm:text-lg font-bold text-foreground">
                เพิ่มงานใหม่
              </Dialog.Title>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="ปิดกล่องเพิ่มงาน"
                className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors -mr-2"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg border border-rose-300 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/40 text-xs text-rose-700 dark:text-rose-300">
                  {errorMessage}
                </div>
              )}

              {/* Task Title */}
              <div className="space-y-1.5">
                <label htmlFor="new-task-title" className="text-xs font-semibold text-foreground">
                  ชื่องาน <span className="text-rose-500">*</span>
                </label>
                <input
                  id="new-task-title"
                  type="text"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    category === "advising"
                      ? "ชื่อโครงงาน – ชื่อนักศึกษา"
                      : category === "review"
                      ? "ชื่อบทความที่รีวิว – ชื่อวารสาร/งานประชุม"
                      : "เช่น บทความใบอ้อย, ตำราการเขียนโปรแกรมบนเว็บ..."
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  required
                />
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Category */}
                <div className="space-y-1.5">
                  <label htmlFor="new-task-category" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>หมวดงาน</span>
                  </label>
                  <select
                    id="new-task-category"
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value as TaskCategory)}
                    className="w-full text-sm font-medium px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] sm:min-h-[38px]"
                  >
                    <option value="article">บทความ</option>
                    <option value="teaching">เอกสารคำสอน/ตำรา</option>
                    <option value="research">วิจัย</option>
                    <option value="advising">ที่ปรึกษา</option>
                    <option value="review">รีวิวบทความ</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label htmlFor="new-task-status" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>สถานะเริ่มต้น</span>
                  </label>
                  <select
                    id="new-task-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full text-sm font-medium px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] sm:min-h-[38px]"
                  >
                    <option value="doing">กำลังทำ (แนะนำ)</option>
                    <option value="polish">ปรับปรุง</option>
                    <option value="waiting">รอผล</option>
                    <option value="todo">ยังไม่เริ่ม</option>
                    <option value="done">เสร็จแล้ว</option>
                  </select>
                </div>
              </div>

              {/* Waiting For (If status is 'waiting') */}
              {status === "waiting" && (
                <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/5 space-y-1.5 animate-in fade-in-50 duration-200">
                  <label htmlFor="new-task-waiting-for" className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>รออะไร / รอใคร:</span>
                  </label>
                  <input
                    id="new-task-waiting-for"
                    type="text"
                    value={waitingFor}
                    onChange={(e) => setWaitingFor(e.target.value)}
                    placeholder="เช่น รอผู้ทรงพิจารณา, รอลายเซ็นหนังสือรับรอง..."
                    className="w-full text-sm px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px] sm:min-h-[38px]"
                  />
                </div>
              )}

              {/* Priority & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>ความสำคัญ</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([1, 2, 3] as TaskPriority[]).map((p) => {
                      const isSelected = priority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
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
                  <label htmlFor="new-task-due-date" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>วันครบกำหนด (ถ้ามี)</span>
                  </label>
                  <ThaiDatePicker
                    id="new-task-due-date"
                    value={dueDate || null}
                    onChange={(iso) => setDueDate(iso || "")}
                  />
                </div>
              </div>

              {/* Step Template Selection */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>เทมเพลตขั้นตอนเริ่มต้น</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplateType("article")}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      templateType === "article"
                        ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                        : "border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <p className="font-medium text-foreground">บทความ</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">7 ขั้นตอนมาตรฐาน</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateType("teaching")}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      templateType === "teaching"
                        ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                        : "border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <p className="font-medium text-foreground">เอกสารคำสอน/ตำรา</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">บทที่ 1 ถึง N</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateType("advising")}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      templateType === "advising"
                        ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                        : "border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <p className="font-medium text-foreground">ที่ปรึกษาโครงงาน</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">8 ขั้นตอน</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateType("review")}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      templateType === "review"
                        ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                        : "border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <p className="font-medium text-foreground">รีวิวบทความ</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">4 ขั้นตอนประเมิน</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateType("research")}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      templateType === "research"
                        ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                        : "border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <p className="font-medium text-foreground">วิจัย</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">ใส่ขั้นตอนเอง</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateType("empty")}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      templateType === "empty"
                        ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                        : "border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <p className="font-medium text-foreground">ว่างเปล่า</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">ไม่มีขั้นตอน</p>
                  </button>
                </div>

                {/* If Teaching: Show Chapter Count Input */}
                {templateType === "teaching" && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg border border-primary/20 bg-primary/[0.04] mt-2">
                    <label htmlFor="template-chapter-count" className="text-xs font-medium text-foreground">
                      ระบุจำนวนบท:
                    </label>
                    <input
                      id="template-chapter-count"
                      type="number"
                      min={1}
                      max={50}
                      value={chapterCount}
                      onChange={(e) => setChapterCount(parseInt(e.target.value) || 1)}
                      className="w-20 px-2 py-1 text-sm rounded border border-input bg-background text-foreground text-center"
                    />
                    <span className="text-xs text-muted-foreground">
                      บท (+ ตรวจอ้างอิง, ปรับปรุงภาพรวม, ส่งตรวจ รวม {chapterCount + 3} ขั้น)
                    </span>
                  </div>
                )}

                {/* Live Steps Preview */}
                <div className="p-3 rounded-xl border border-border/80 bg-muted/30 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      ตัวอย่างขั้นตอนที่จะถูกสร้าง ({previewSteps.length} ขั้น)
                    </span>
                  </div>
                  {previewSteps.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {previewSteps.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-background border border-border text-foreground font-normal"
                        >
                          {idx + 1}. {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      ไม่มีขั้นตอนเริ่มต้น (สามารถเพิ่มขั้นตอนได้ในหน้ารายละเอียดงาน)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors min-h-[44px]"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all min-h-[44px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังสร้าง...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>สร้างงานและเปิดรายละเอียด</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
