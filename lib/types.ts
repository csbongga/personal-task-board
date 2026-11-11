export type TaskCategory =
  | "article"
  | "teaching"
  | "research"
  | "advising"
  | "review"
  | "other";

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

export const CATEGORY_ORDER: TaskCategory[] = [
  "article",
  "teaching",
  "research",
  "advising",
  "review",
  "other",
];

export const CATEGORY_CONFIG: Record<
  TaskCategory,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    dotClass: string;
    cardBgLight: string;
    cardBorderLeftColor: string;
    cardClass: string;
  }
> = {
  article: {
    label: "บทความ",
    shortLabel: "บทความ",
    badgeClass:
      "bg-blue-100/90 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800",
    dotClass: "bg-[#3B82F6]",
    cardBgLight: "#EFF6FF",
    cardBorderLeftColor: "#3B82F6",
    cardClass:
      "bg-[#EFF6FF] dark:bg-[#3B82F6]/10 border-l-[4px] border-l-[#3B82F6] border-t border-r border-b border-blue-200/70 dark:border-t-blue-500/20 dark:border-r-blue-500/20 dark:border-b-blue-500/20",
  },
  teaching: {
    label: "เอกสารคำสอน/ตำรา",
    shortLabel: "เอกสารคำสอน",
    badgeClass:
      "bg-green-100/90 text-green-800 border-green-200 dark:bg-green-950/80 dark:text-green-300 dark:border-green-800",
    dotClass: "bg-[#22C55E]",
    cardBgLight: "#F0FDF4",
    cardBorderLeftColor: "#22C55E",
    cardClass:
      "bg-[#F0FDF4] dark:bg-[#22C55E]/10 border-l-[4px] border-l-[#22C55E] border-t border-r border-b border-green-200/70 dark:border-t-green-500/20 dark:border-r-green-500/20 dark:border-b-green-500/20",
  },
  research: {
    label: "วิจัย",
    shortLabel: "วิจัย",
    badgeClass:
      "bg-purple-100/90 text-purple-800 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800",
    dotClass: "bg-[#A855F7]",
    cardBgLight: "#FAF5FF",
    cardBorderLeftColor: "#A855F7",
    cardClass:
      "bg-[#FAF5FF] dark:bg-[#A855F7]/10 border-l-[4px] border-l-[#A855F7] border-t border-r border-b border-purple-200/70 dark:border-t-purple-500/20 dark:border-r-purple-500/20 dark:border-b-purple-500/20",
  },
  advising: {
    label: "ที่ปรึกษา",
    shortLabel: "ที่ปรึกษา",
    badgeClass:
      "bg-orange-100/90 text-orange-800 border-orange-200 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-800",
    dotClass: "bg-[#F97316]",
    cardBgLight: "#FFF7ED",
    cardBorderLeftColor: "#F97316",
    cardClass:
      "bg-[#FFF7ED] dark:bg-[#F97316]/10 border-l-[4px] border-l-[#F97316] border-t border-r border-b border-orange-200/70 dark:border-t-orange-500/20 dark:border-r-orange-500/20 dark:border-b-orange-500/20",
  },
  review: {
    label: "รีวิวบทความ",
    shortLabel: "รีวิวบทความ",
    badgeClass:
      "bg-pink-100/90 text-pink-800 border-pink-200 dark:bg-pink-950/80 dark:text-pink-300 dark:border-pink-800",
    dotClass: "bg-[#EC4899]",
    cardBgLight: "#FDF2F8",
    cardBorderLeftColor: "#EC4899",
    cardClass:
      "bg-[#FDF2F8] dark:bg-[#EC4899]/10 border-l-[4px] border-l-[#EC4899] border-t border-r border-b border-pink-200/70 dark:border-t-pink-500/20 dark:border-r-pink-500/20 dark:border-b-pink-500/20",
  },
  other: {
    label: "อื่นๆ",
    shortLabel: "อื่นๆ",
    badgeClass:
      "bg-slate-200/80 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dotClass: "bg-[#94A3B8]",
    cardBgLight: "#F8FAFC",
    cardBorderLeftColor: "#94A3B8",
    cardClass:
      "bg-[#F8FAFC] dark:bg-[#94A3B8]/10 border-l-[4px] border-l-[#94A3B8] border-t border-r border-b border-slate-200/90 dark:border-t-slate-500/20 dark:border-r-slate-500/20 dark:border-b-slate-500/20",
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
  todo: {
    label: "ยังไม่เริ่ม",
    mobileLabel: "ยังไม่เริ่ม",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    headerClass: "border-t-4 border-t-slate-400 dark:border-t-slate-500",
    dotClass: "bg-slate-400",
    barClass: "bg-slate-500",
  },
  done: {
    label: "เสร็จแล้ว",
    mobileLabel: "เสร็จแล้ว",
    badgeClass:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/80 dark:text-green-300 dark:border-green-800",
    headerClass: "border-t-4 border-t-green-600 dark:border-t-green-500",
    dotClass: "bg-green-600",
    barClass: "bg-green-600",
  },
};

// เรียงคอลัมน์ใหม่: กำลังทำ · ปรับปรุง · รอผล · ยังไม่เริ่ม · เสร็จแล้ว
export const DESKTOP_COLUMNS: TaskStatus[] = [
  "doing",
  "polish",
  "waiting",
  "todo",
  "done",
];

// แท็บบนมือถือเรียงลำดับเดียวกัน: กำลังทำ · ปรับปรุง · รอผล · ยังไม่เริ่ม · เสร็จแล้ว
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
