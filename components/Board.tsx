"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import {
  BoardDataResponse,
  Task,
  Step,
  TaskCategory,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
  ReorderTasksItem,
  DESKTOP_COLUMNS,
  STATUS_CONFIG,
} from "@/lib/types";
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  reorderTasksAction,
  addStepAction,
  addBulkStepsAction,
  toggleStepAction,
  updateStepTitleAction,
  deleteStepAction,
  reorderStepsAction,
  seedInitialDataAction,
} from "@/app/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InstallPwaPrompt } from "@/components/InstallPwaPrompt";
import { SummaryBar } from "@/components/SummaryBar";
import { FilterBar } from "@/components/FilterBar";
import { MobileTabs } from "@/components/MobileTabs";
import { TaskCard } from "@/components/TaskCard";
import { Column } from "@/components/Column";
import { TaskDetail } from "@/components/TaskDetail";
import { NewTaskDialog } from "@/components/NewTaskDialog";
import {
  Plus,
  Sparkles,
  ClipboardList,
  Loader2,
  Database,
  Cloud,
  CheckCircle2,
} from "lucide-react";

export interface BoardProps {
  initialData: BoardDataResponse;
}

export function Board({ initialData }: BoardProps) {
  // Main state
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks || []);
  const [storageMode] = useState<"supabase" | "local">(
    initialData.storageMode || "local"
  );

  // Filters & Tabs
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | "all">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMobileTab, setActiveMobileTab] = useState<TaskStatus>("doing");

  // Dialogs & Selection
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [showCompletePromptForTaskId, setShowCompletePromptForTaskId] =
    useState<string | null>(null);

  // Dragging & Seeding
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);
  const [dragStartTasks, setDragStartTasks] = useState<Task[] | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Sensors for Desktop Kanban
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

  // Currently selected task object
  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<TaskCategory | "all", number> = {
      all: tasks.length,
      article: 0,
      teaching: 0,
      research: 0,
      advising: 0,
      review: 0,
      other: 0,
    };
    tasks.forEach((t) => {
      if (counts[t.category] !== undefined) {
        counts[t.category]++;
      }
    });
    return counts;
  }, [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (selectedCategory !== "all" && task.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchWaiting = task.waiting_for?.toLowerCase().includes(q);
        const matchNote = task.note?.toLowerCase().includes(q);
        const matchSteps = task.steps?.some((s) =>
          s.title.toLowerCase().includes(q)
        );
        if (!matchTitle && !matchWaiting && !matchNote && !matchSteps) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, selectedCategory, searchQuery]);

  // Status counts for MobileTabs (based on filteredTasks)
  const statusCounts = useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      todo: 0,
      doing: 0,
      polish: 0,
      waiting: 0,
      done: 0,
    };
    filteredTasks.forEach((t) => {
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      }
    });
    return counts;
  }, [filteredTasks]);

  // Handlers for Opening Detail
  const handleOpenDetail = useCallback((task: Task) => {
    setSelectedTaskId(task.id);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedTaskId(null);
    setShowCompletePromptForTaskId(null);
  }, []);

  // Quick Move Status
  const handleMoveStatus = useCallback(
    async (task: Task, newStatus: TaskStatus) => {
      if (task.status === newStatus) return;

      const prevTasks = [...tasks];
      // Optimistic update
      setTasks((current) =>
        current.map((t) =>
          t.id === task.id ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
        )
      );

      try {
        await updateTaskAction(task.id, { status: newStatus });
        toast.success(`ย้ายไป "${STATUS_CONFIG[newStatus].label}" แล้ว`);
      } catch (err) {
        console.error("Failed to move status:", err);
        setTasks(prevTasks);
        toast.error("ไม่สามารถย้ายสถานะได้ กรุณาลองใหม่อีกครั้ง");
      }
    },
    [tasks]
  );

  // Toggle Next Step from Card
  const handleToggleNextStep = useCallback(
    async (task: Task, step: Step) => {
      const prevTasks = [...tasks];
      const nextDone = true;
      const now = new Date().toISOString();

      // Optimistically update
      setTasks((current) =>
        current.map((t) => {
          if (t.id !== task.id) return t;
          const updatedSteps = (t.steps || []).map((s) =>
            s.id === step.id ? { ...s, done: nextDone, done_at: now } : s
          );
          return { ...t, steps: updatedSteps };
        })
      );

      try {
        const { allStepsDone } = await toggleStepAction(step.id, nextDone);

        // Check if all steps done and prompt if not in done
        if (allStepsDone && task.status !== "done") {
          toast.success(`ติ๊ก "${step.title}" เสร็จแล้ว`, {
            description: "🎉 ทำครบทุกขั้นตอนแล้ว! ย้ายงานนี้ไป 'เสร็จแล้ว' ไหม?",
            action: {
              label: "ย้ายไป เสร็จแล้ว",
              onClick: () => handleMoveStatus(task, "done"),
            },
            duration: 6500,
          });
        } else {
          toast.success(`ติ๊ก "${step.title}" เสร็จแล้ว`);
        }
      } catch (err) {
        console.error("Failed to toggle next step:", err);
        setTasks(prevTasks);
        toast.error("ไม่สามารถบันทึกขั้นตอนได้");
      }
    },
    [tasks, handleMoveStatus]
  );

  // Detail Modal: Step Toggle
  const handleToggleStep = useCallback(
    async (task: Task, step: Step, done: boolean) => {
      const prevTasks = [...tasks];
      const now = new Date().toISOString();

      setTasks((current) =>
        current.map((t) => {
          if (t.id !== task.id) return t;
          const updatedSteps = (t.steps || []).map((s) =>
            s.id === step.id ? { ...s, done, done_at: done ? now : null } : s
          );
          return { ...t, steps: updatedSteps };
        })
      );

      try {
        const { allStepsDone } = await toggleStepAction(step.id, done);
        if (done && allStepsDone && task.status !== "done") {
          setShowCompletePromptForTaskId(task.id);
        }
      } catch (err) {
        console.error("Failed to toggle step:", err);
        setTasks(prevTasks);
        toast.error("ไม่สามารถเปลี่ยนสถานะขั้นตอนได้");
      }
    },
    [tasks]
  );

  // Detail Modal: Add Step
  const handleAddStep = useCallback(
    async (taskId: string, title: string) => {
      const prevTasks = [...tasks];
      const tempId = `temp-${Date.now()}`;
      const tempStep: Step = {
        id: tempId,
        task_id: taskId,
        title,
        done: false,
        done_at: null,
        position: 9999,
      };

      setTasks((current) =>
        current.map((t) =>
          t.id === taskId
            ? { ...t, steps: [...(t.steps || []), tempStep] }
            : t
        )
      );

      try {
        const createdStep = await addStepAction(taskId, title);
        setTasks((current) =>
          current.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              steps: (t.steps || []).map((s) =>
                s.id === tempId ? createdStep : s
              ),
            };
          })
        );
        toast.success(`เพิ่มขั้นตอน "${title}" แล้ว`);
      } catch (err) {
        console.error("Failed to add step:", err);
        setTasks(prevTasks);
        toast.error("ไม่สามารถเพิ่มขั้นตอนได้");
      }
    },
    [tasks]
  );

  // Detail Modal: Add Bulk Steps
  const handleAddBulkSteps = useCallback(
    async (taskId: string, titles: string[]) => {
      const prevTasks = [...tasks];

      try {
        const createdSteps = await addBulkStepsAction(taskId, titles);
        setTasks((current) =>
          current.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              steps: [...(t.steps || []), ...createdSteps],
            };
          })
        );
        toast.success(`เพิ่ม ${titles.length} ขั้นตอนสำเร็จแล้ว`);
      } catch (err) {
        console.error("Failed to add bulk steps:", err);
        setTasks(prevTasks);
        toast.error("ไม่สามารถเพิ่มขั้นตอนเป็นชุดได้");
      }
    },
    [tasks]
  );

  // Detail Modal: Update Step Title
  const handleUpdateStepTitle = useCallback(
    async (taskId: string, stepId: string, title: string) => {
      const prevTasks = [...tasks];

      setTasks((current) =>
        current.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            steps: (t.steps || []).map((s) =>
              s.id === stepId ? { ...s, title } : s
            ),
          };
        })
      );

      try {
        await updateStepTitleAction(stepId, title);
      } catch (err) {
        console.error("Failed to update step title:", err);
        setTasks(prevTasks);
        toast.error("ไม่สามารถแก้ไขชื่อขั้นตอนได้");
      }
    },
    [tasks]
  );

  // Detail Modal: Delete Step
  const handleDeleteStep = useCallback(
    async (taskId: string, stepId: string) => {
      const prevTasks = [...tasks];

      setTasks((current) =>
        current.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            steps: (t.steps || []).filter((s) => s.id !== stepId),
          };
        })
      );

      try {
        await deleteStepAction(stepId);
        toast.success("ลบขั้นตอนแล้ว");
      } catch (err) {
        console.error("Failed to delete step:", err);
        setTasks(prevTasks);
        toast.error("ไม่สามารถลบขั้นตอนได้");
      }
    },
    [tasks]
  );

  // Detail Modal: Reorder Steps
  const handleReorderSteps = useCallback(
    async (taskId: string, newSteps: Step[]) => {
      const prevTasks = [...tasks];

      setTasks((current) =>
        current.map((t) => (t.id === taskId ? { ...t, steps: newSteps } : t))
      );

      try {
        await reorderStepsAction(
          taskId,
          newSteps.map((s, idx) => ({ id: s.id, position: idx }))
        );
      } catch (err) {
        console.error("Failed to reorder steps:", err);
        setTasks(prevTasks);
        toast.error("ไม่สามารถบันทึกลำดับขั้นตอนได้");
      }
    },
    [tasks]
  );

  // Detail Modal: Update Task
  const handleUpdateTask = useCallback(
    async (taskId: string, updates: UpdateTaskInput) => {
      const prevTasks = [...tasks];

      setTasks((current) =>
        current.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
      );

      try {
        const updated = await updateTaskAction(taskId, updates);
        setTasks((current) =>
          current.map((t) => (t.id === taskId ? { ...t, ...updated } : t))
        );
      } catch (err) {
        console.error("Failed to update task:", err);
        setTasks(prevTasks);
        toast.error("ไม่สามารถบันทึกข้อมูลงานได้");
      }
    },
    [tasks]
  );

  // Detail Modal: Delete Task
  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      const prevTasks = [...tasks];

      setTasks((current) => current.filter((t) => t.id !== taskId));
      handleCloseDetail();

      try {
        await deleteTaskAction(taskId);
        toast.success("ลบงานเรียบร้อยแล้ว");
      } catch (err) {
        console.error("Failed to delete task:", err);
        setTasks(prevTasks);
        toast.error("ไม่สามารถลบงานได้");
      }
    },
    [tasks, handleCloseDetail]
  );

  // Create Task: opens task detail immediately upon creation
  const handleCreateTask = useCallback(
    async (input: CreateTaskInput) => {
      try {
        const created = await createTaskAction(input);
        setTasks((current) => [created, ...current]);
        toast.success(`สร้างงาน "${created.title}" สำเร็จแล้ว`);
        // Immediately open task detail for the newly created task
        setSelectedTaskId(created.id);
        setIsDetailOpen(true);
      } catch (err) {
        console.error("Failed to create task:", err);
        toast.error("เกิดข้อผิดพลาดในการสร้างงาน");
        throw err;
      }
    },
    []
  );

  // Seed Initial 7 Tasks
  const handleSeedData = useCallback(async () => {
    try {
      setIsSeeding(true);
      const res = await seedInitialDataAction();
      setTasks(res.tasks);
      toast.success("นำเข้าข้อมูลตัวอย่าง 7 งานเริ่มต้นสำเร็จแล้ว!");
    } catch (err) {
      console.error("Failed to seed data:", err);
      toast.error("เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
    } finally {
      setIsSeeding(false);
    }
  }, []);

  // Drag and Drop (Kanban Board)
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id) || null;
    setActiveDragTask(task ? { ...task } : null);
    setDragStartTasks([...tasks]);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Check if over a column or another task
    let targetStatus: TaskStatus | null = null;
    if (DESKTOP_COLUMNS.includes(overId as TaskStatus)) {
      targetStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (!targetStatus || activeTask.status === targetStatus) return;

    // Move task to target status column optimistically while dragging
    setTasks((current) =>
      current.map((t) => (t.id === activeId ? { ...t, status: targetStatus! } : t))
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const originalStatus = activeDragTask?.status;
    const snapshotBeforeDrag = dragStartTasks || [...tasks];
    setActiveDragTask(null);
    setDragStartTasks(null);

    if (!over) {
      setTasks(snapshotBeforeDrag);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Determine final status
    let finalStatus: TaskStatus = activeTask.status;
    if (DESKTOP_COLUMNS.includes(overId as TaskStatus)) {
      finalStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        finalStatus = overTask.status;
      }
    }

    // Tasks in the destination status
    const columnTasks = tasks
      .filter((t) => t.status === finalStatus)
      .sort((a, b) => a.position - b.position);

    const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
    let newIndex = columnTasks.findIndex((t) => t.id === overId);

    if (newIndex === -1) {
      newIndex = columnTasks.length - 1;
    }

    let reorderedColumn: Task[];
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderedColumn = arrayMove(columnTasks, oldIndex, newIndex);
    } else {
      reorderedColumn = [...columnTasks];
    }

    // Assign sequential positions
    const itemsToReorder: ReorderTasksItem[] = reorderedColumn.map(
      (task, index) => ({
        id: task.id,
        status: finalStatus,
        position: index,
      })
    );

    const fromStatus = originalStatus || activeTask.status;
    const isStatusChanged = fromStatus !== finalStatus;

    // Update state
    setTasks((current) => {
      const updatedMap = new Map(
        reorderedColumn.map((task, index) => [
          task.id,
          { ...task, status: finalStatus, position: index },
        ])
      );
      return current.map((t) => updatedMap.get(t.id) || t);
    });

    try {
      await reorderTasksAction(
        itemsToReorder,
        isStatusChanged
          ? {
              taskId: activeTask.id,
              fromStatus,
              toStatus: finalStatus,
            }
          : undefined
      );
    } catch (err) {
      console.error("Failed to persist task reorder:", err);
      setTasks(snapshotBeforeDrag);
      toast.error("ไม่สามารถบันทึกลำดับงานได้");
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200/90 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="w-full px-4 sm:px-6 lg:px-[24px] py-3.5 flex items-center justify-between gap-3">
          {/* Brand & Subtitle */}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                งานอาจารย์เปรม
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60">
                {storageMode === "supabase" ? (
                  <>
                    <Cloud className="w-3 h-3 text-blue-500" />
                    <span>Supabase</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3 h-3 text-slate-500" />
                    <span>Local Demo</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              กระดานติดตามงานบทความ ตำรา และงานวิจัย
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <InstallPwaPrompt />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsNewTaskOpen(true)}
              className="hidden md:inline-flex min-h-[44px] items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>เพิ่มงาน</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-[24px] py-3 lg:py-4 flex flex-col gap-3.5 lg:min-h-0 lg:overflow-hidden">
        {/* Summary Metric Cards */}
        <div className="shrink-0">
          <SummaryBar tasks={tasks} />
        </div>

        {/* Category Filter & Search Bar */}
        <div className="shrink-0">
          <FilterBar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categoryCounts={categoryCounts}
          />
        </div>

        {/* Empty State Banner (If 0 tasks) */}
        {tasks.length === 0 && (
          <div className="p-8 sm:p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 text-center max-w-xl mx-auto space-y-4 shadow-sm my-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
              <ClipboardList className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                ยังไม่มีงานในระบบ
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                คุณสามารถเพิ่มงานใหม่ หรือคลิกเพื่อนำเข้าชุดงานตัวอย่าง 7 งานเริ่มต้นของอาจารย์เปรม
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleSeedData}
                disabled={isSeeding}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs sm:text-sm shadow-sm transition disabled:opacity-50 min-h-[44px]"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังนำเข้า...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>นำเข้าข้อมูลตัวอย่าง (7 งานเริ่มต้น)</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsNewTaskOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm transition min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มงานใหม่</span>
              </button>
            </div>
          </div>
        )}

        {/* Desktop Kanban View (≥ 768px) */}
        {tasks.length > 0 && (
          <div className="hidden md:flex flex-1 min-h-0 flex-col">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-3 w-full flex-1 min-h-0 items-stretch overflow-x-auto lg:overflow-x-hidden pb-1">
                {DESKTOP_COLUMNS.map((status) => {
                  const columnTasks = filteredTasks
                    .filter((t) => t.status === status)
                    .sort((a, b) => a.position - b.position);

                  return (
                    <Column
                      key={status}
                      status={status}
                      tasks={columnTasks}
                      onOpenDetail={handleOpenDetail}
                      onToggleNextStep={handleToggleNextStep}
                      onMoveStatus={handleMoveStatus}
                      defaultCollapsed={status === "done"}
                    />
                  );
                })}
              </div>

              {/* Drag Overlay Preview */}
              <DragOverlay dropAnimation={null}>
                {activeDragTask ? (
                  <div className="w-[300px] pointer-events-none rotate-2 scale-105 shadow-2xl opacity-95">
                    <TaskCard
                      task={activeDragTask}
                      onOpenDetail={() => {}}
                      onToggleNextStep={() => {}}
                      onMoveStatus={() => {}}
                      isSortable={false}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}

        {/* Mobile View (< 768px) */}
        {tasks.length > 0 && (
          <div className="block md:hidden space-y-4">
            {/* Mobile Tab Selector */}
            <MobileTabs
              activeTab={activeMobileTab}
              onSelectTab={setActiveMobileTab}
              statusCounts={statusCounts}
            />

            {/* List of Tasks for Selected Tab */}
            <div className="space-y-3 pt-1">
              {filteredTasks
                .filter((t) => t.status === activeMobileTab)
                .sort((a, b) => a.position - b.position)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpenDetail={handleOpenDetail}
                    onToggleNextStep={handleToggleNextStep}
                    onMoveStatus={handleMoveStatus}
                    isSortable={false}
                  />
                ))}

              {filteredTasks.filter((t) => t.status === activeMobileTab).length === 0 && (
                <div className="py-12 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 text-center">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    ไม่มีงานในสถานะนี้
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    กดปุ่ม + ด้านล่างเพื่อเพิ่มงานใหม่
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setIsNewTaskOpen(true)}
        aria-label="เพิ่มงานใหม่"
        className="md:hidden fixed bottom-5 right-5 z-40 min-h-[52px] min-w-[52px] rounded-full shadow-2xl flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/30"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span className="text-sm font-semibold pr-1">เพิ่มงาน</span>
      </button>

      {/* Task Detail Modal / Sheet */}
      <TaskDetail
        task={selectedTask}
        open={isDetailOpen}
        onClose={handleCloseDetail}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onToggleStep={handleToggleStep}
        onAddStep={handleAddStep}
        onAddBulkSteps={handleAddBulkSteps}
        onUpdateStepTitle={handleUpdateStepTitle}
        onDeleteStep={handleDeleteStep}
        onReorderSteps={handleReorderSteps}
        showCompletePrompt={showCompletePromptForTaskId === selectedTask?.id}
        onDismissCompletePrompt={() => setShowCompletePromptForTaskId(null)}
      />

      {/* New Task Dialog */}
      <NewTaskDialog
        open={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
}

export default Board;
