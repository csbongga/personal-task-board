export type TaskCategory = "article" | "teaching" | "research" | "other";

export type TaskStatus = "todo" | "doing" | "polish" | "waiting" | "done";

export type TaskPriority = 1 | 2 | 3;

export interface Step {
  id: string;
  task_id: string;
  title: string;
  done: boolean;
  done_at: string | null;
  position: number;
}

export interface Activity {
  id: string;
  task_id: string;
  message: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  waiting_for: string | null;
  priority: TaskPriority;
  due_date: string | null;
  note: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  steps: Step[];
  activities?: Activity[];
}

export interface BoardDataResponse {
  tasks: Task[];
  activities: Activity[];
  storageMode: "supabase" | "local";
}

export interface CreateTaskInput {
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  waiting_for?: string | null;
  priority?: TaskPriority;
  due_date?: string | null;
  note?: string | null;
  initialSteps?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  category?: TaskCategory;
  status?: TaskStatus;
  waiting_for?: string | null;
  priority?: TaskPriority;
  due_date?: string | null;
  note?: string | null;
  position?: number;
}

export interface ReorderTasksItem {
  id: string;
  status: TaskStatus;
  position: number;
}

export interface ReorderStepsItem {
  id: string;
  position: number;
}

export const CATEGORY_CONFIG: Record<
  TaskCategory,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  article: {
    label: "บทความ",
    shortLabel: "บทความ",
    badgeClass:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800",
    dotClass: "bg-blue-600 dark:bg-blue-400",
  },
  teaching: {
    label: "เอกสารคำสอน/ตำรา",
    shortLabel: "เอกสารคำสอน",
    badgeClass:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-600 dark:bg-emerald-400",
  },
  research: {
    label: "วิจัย",
    shortLabel: "วิจัย",
    badgeClass:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800",
    dotClass: "bg-purple-600 dark:bg-purple-400",
  },
  other: {
    label: "อื่นๆ",
    shortLabel: "อื่นๆ",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dotClass: "bg-slate-500 dark:bg-slate-400",
  },
};

export const STATUS_CONFIG: Record<
  TaskStatus,
  {
    label: string;
    mobileLabel: string;
    badgeClass: string;
    headerClass: string;
    dotClass: string;
    barClass: string;
  }
> = {
  todo: {
    label: "ยังไม่เริ่ม",
    mobileLabel: "ยังไม่เริ่ม",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    headerClass: "border-t-4 border-t-slate-400 dark:border-t-slate-500",
    dotClass: "bg-slate-400",
    barClass: "bg-slate-500",
  },
  doing: {
    label: "กำลังทำ",
    mobileLabel: "กำลังทำ",
    badgeClass:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800",
    headerClass: "border-t-4 border-t-blue-600 dark:border-t-blue-500",
    dotClass: "bg-blue-600",
    barClass: "bg-blue-600",
  },
  polish: {
    label: "ปรับปรุง",
    mobileLabel: "ปรับปรุง",
    badgeClass:
      "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/80 dark:text-teal-300 dark:border-teal-800",
    headerClass: "border-t-4 border-t-teal-500 dark:border-t-teal-400",
    dotClass: "bg-teal-500",
    barClass: "bg-teal-500",
  },
  waiting: {
    label: "รอผล",
    mobileLabel: "รอผล",
    badgeClass:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800",
    headerClass: "border-t-4 border-t-amber-500 dark:border-t-amber-400",
    dotClass: "bg-amber-500",
    barClass: "bg-amber-500",
  },
  done: {
    label: "เสร็จแล้ว",
    mobileLabel: "เสร็จ",
    badgeClass:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/80 dark:text-green-300 dark:border-green-800",
    headerClass: "border-t-4 border-t-green-600 dark:border-t-green-500",
    dotClass: "bg-green-600",
    barClass: "bg-green-600",
  },
};

export const DESKTOP_COLUMNS: TaskStatus[] = [
  "todo",
  "doing",
  "polish",
  "waiting",
  "done",
];

export const MOBILE_TABS: TaskStatus[] = [
  "doing",
  "polish",
  "waiting",
  "todo",
  "done",
];

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; badgeClass: string }
> = {
  1: {
    label: "สูง",
    badgeClass:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800",
  },
  2: {
    label: "ปกติ",
    badgeClass:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  },
  3: {
    label: "ต่ำ",
    badgeClass:
      "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800",
  },
};
