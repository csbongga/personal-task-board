"use client";

import React, { useState, useRef } from "react";
import { Step } from "@/lib/types";
import { generateTeachingSteps, generateChaptersOnly } from "@/lib/templates";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  GripVertical,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  Layers,
  Sparkles,
  ListPlus,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

export interface StepListProps {
  taskId: string;
  steps: Step[];
  onToggleStep: (step: Step, done: boolean) => void;
  onAddStep: (title: string) => void;
  onAddBulkSteps: (titles: string[]) => void;
  onUpdateStepTitle: (stepId: string, title: string) => void;
  onDeleteStep: (stepId: string) => void;
  onReorderSteps: (newSteps: Step[]) => void;
}

interface SortableStepItemProps {
  step: Step;
  onToggle: (done: boolean) => void;
  onUpdateTitle: (title: string) => void;
  onDelete: () => void;
}

function SortableStepItem({
  step,
  onToggle,
  onUpdateTitle,
  onDelete,
}: SortableStepItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(step.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleStartEdit = () => {
    setEditTitle(step.title);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSaveEdit = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== step.title) {
      onUpdateTitle(trimmed);
    } else {
      setEditTitle(step.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setEditTitle(step.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 p-2 sm:p-2.5 rounded-lg border transition-all ${
        isDragging
          ? "opacity-50 ring-2 ring-primary bg-primary/5 shadow-md"
          : step.done
          ? "bg-muted/40 border-border/50 text-muted-foreground"
          : "bg-card border-border hover:border-primary/40 shadow-sm"
      }`}
    >
      {/* Drag handle */}
      <button
        type="button"
        aria-label="ลากเพื่อเรียงลำดับ"
        className="touch-none text-muted-foreground/60 hover:text-foreground cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Checkbox (min 44x44 target on touch devices) */}
      <button
        type="button"
        onClick={() => onToggle(!step.done)}
        aria-label={step.done ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
        className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary -m-1 sm:m-0"
      >
        <span
          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
            step.done
              ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
              : "border-muted-foreground/40 hover:border-primary bg-background"
          }`}
        >
          {step.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </span>
      </button>

      {/* Title / Inline Edit */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className="w-full text-sm font-normal px-2 py-1 bg-background border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
        ) : (
          <span
            onClick={handleStartEdit}
            title="คลิกเพื่อแก้ไขชื่อขั้นตอน"
            className={`block text-sm cursor-text select-text truncate ${
              step.done
                ? "line-through text-muted-foreground/80"
                : "text-foreground font-normal hover:text-primary transition-colors"
            }`}
          >
            {step.title}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {!isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            title="แก้ไขชื่อขั้นตอน"
            className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          title="ลบขั้นตอนนี้"
          className="p-1.5 text-muted-foreground hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function StepList({
  steps,
  onToggleStep,
  onAddStep,
  onAddBulkSteps,
  onUpdateStepTitle,
  onDeleteStep,
  onReorderSteps,
}: StepListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [bulkMode, setBulkMode] = useState<"chapters" | "text">("chapters");
  const [chapterCount, setChapterCount] = useState<number>(15);
  const [includeReviewSteps, setIncludeReviewSteps] = useState(true);
  const [bulkText, setBulkText] = useState("");
  const singleInputRef = useRef<HTMLInputElement>(null);

  // DND Kit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const completedCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(steps, oldIndex, newIndex).map((s, idx) => ({
        ...s,
        position: idx,
      }));
      onReorderSteps(reordered);
    }
  };

  const handleAddSingle = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onAddStep(trimmed);
    setNewTitle("");
    singleInputRef.current?.focus();
  };

  const handleCreateChapters = () => {
    const count = Math.max(1, Math.min(50, Math.floor(chapterCount || 15)));
    const generated = includeReviewSteps
      ? generateTeachingSteps(count)
      : generateChaptersOnly(count);

    if (generated.length > 0) {
      onAddBulkSteps(generated);
      setShowBulk(false);
    }
  };

  const handleAddBulkText = () => {
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length > 0) {
      onAddBulkSteps(lines);
      setBulkText("");
      setShowBulk(false);
    }
  };

  const previewLines = bulkText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return (
    <div className="space-y-4">
      {/* Progress & Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground flex items-center gap-1.5">
            ขั้นตอนทั้งหมด ({totalCount})
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            {totalCount > 0 ? (
              <>
                เสร็จ <span className="text-foreground font-semibold">{completedCount}</span> จาก {totalCount} ขั้นตอน ({percent}%)
              </>
            ) : (
              "ยังไม่มีขั้นตอน"
            )}
          </span>
        </div>

        {totalCount > 0 && (
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                percent === 100 ? "bg-emerald-600" : "bg-primary"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </div>

      {/* Drag & Drop Sortable List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={steps.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1.5">
            {steps.map((step) => (
              <SortableStepItem
                key={step.id}
                step={step}
                onToggle={(done) => onToggleStep(step, done)}
                onUpdateTitle={(title) => onUpdateStepTitle(step.id, title)}
                onDelete={() => onDeleteStep(step.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Single Add Input */}
      <div className="flex items-center gap-2">
        <input
          ref={singleInputRef}
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddSingle();
            }
          }}
          placeholder="พิมพ์ชื่อขั้นตอนใหม่ แล้วกด Enter..."
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] sm:min-h-[38px]"
        />
        <button
          type="button"
          onClick={handleAddSingle}
          disabled={!newTitle.trim()}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] sm:min-h-[38px] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่ม</span>
        </button>
      </div>

      {/* Bulk Add Button Toggle */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowBulk(!showBulk)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors py-1 px-2 rounded-md hover:bg-primary/5"
        >
          <ListPlus className="w-4 h-4" />
          <span>เพิ่มหลายขั้นพร้อมกัน / ทางลัดสร้างบทที่ 1-N</span>
          {showBulk ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Bulk Add Tool Panel */}
      {showBulk && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.03] dark:bg-primary/[0.06] space-y-3.5 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkMode("chapters")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  bulkMode === "chapters"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                สร้างบทที่ 1 ถึง N (ตำรา)
              </button>
              <button
                type="button"
                onClick={() => setBulkMode("text")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  bulkMode === "text"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                วางข้อความหลายบรรทัด
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowBulk(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {bulkMode === "chapters" ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="chapter-count" className="text-xs font-medium text-foreground whitespace-nowrap">
                    จำนวนบท:
                  </label>
                  <input
                    id="chapter-count"
                    type="number"
                    min={1}
                    max={50}
                    value={chapterCount}
                    onChange={(e) => setChapterCount(parseInt(e.target.value) || 1)}
                    className="w-20 px-2.5 py-1.5 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground">บท</span>
                </div>

                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeReviewSteps}
                    onChange={(e) => setIncludeReviewSteps(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>ต่อท้ายด้วย: ตรวจอ้างอิง, ปรับปรุงภาพรวม, ส่งตรวจ</span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">
                  จะสร้าง {chapterCount + (includeReviewSteps ? 3 : 0)} ขั้นตอน
                </span>
                <button
                  type="button"
                  onClick={handleCreateChapters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>สร้างบทที่ 1 ถึง {chapterCount} ทันที</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="วางรายการขั้นตอนที่นี่ (1 บรรทัด = 1 ขั้นตอน)&#10;เช่น&#10;บทนำและทบทวนวรรณกรรม&#10;ระเบียบวิธีวิจัย&#10;ผลการศึกษาและอภิปราย&#10;สรุปผลและข้อเสนอแนะ"
                rows={4}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {previewLines.length > 0
                    ? `พบ ${previewLines.length} ขั้นตอน`
                    : "พิมพ์หรือวางข้อความ 1 บรรทัดต่อ 1 ขั้นตอน"}
                </span>
                <button
                  type="button"
                  onClick={handleAddBulkText}
                  disabled={previewLines.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>เพิ่มทั้งหมด ({previewLines.length} ขั้น)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
