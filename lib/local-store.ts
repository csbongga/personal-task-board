import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { INITIAL_SEED_TASKS } from "./templates";
import {
  Activity,
  BoardDataResponse,
  CreateTaskInput,
  ReorderStepsItem,
  ReorderTasksItem,
  STATUS_CONFIG,
  Step,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from "./types";

interface LocalDBData {
  tasks: Task[];
  activities: Activity[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE_PATH = path.join(DATA_DIR, "local-db.json");

// In-memory fallback if the filesystem is read-only (e.g. serverless environments)
let memoryStore: LocalDBData | null = null;

/**
 * Generates fresh initial seed tasks, steps, and activities from INITIAL_SEED_TASKS.
 */
function createInitialSeedData(): LocalDBData {
  const tasks: Task[] = [];
  const activities: Activity[] = [];
  const now = new Date().toISOString();

  for (const seed of INITIAL_SEED_TASKS) {
    const taskId = crypto.randomUUID();
    const taskSteps: Step[] = seed.steps.map((st, index) => ({
      id: crypto.randomUUID(),
      task_id: taskId,
      title: st.title,
      done: st.done,
      done_at: st.done ? now : null,
      position: index,
    }));

    const task: Task = {
      id: taskId,
      title: seed.title,
      category: seed.category,
      status: seed.status,
      waiting_for: seed.waiting_for,
      priority: seed.priority,
      due_date: null,
      note: null,
      position: seed.position,
      created_at: now,
      updated_at: now,
      steps: taskSteps,
    };

    const initialActivity: Activity = {
      id: crypto.randomUUID(),
      task_id: taskId,
      message: "สร้างงานเริ่มต้นตามระบบ",
      created_at: now,
    };

    task.activities = [initialActivity];
    tasks.push(task);
    activities.push(initialActivity);
  }

  return { tasks, activities };
}

/**
 * Reads data from `.data/local-db.json` or falls back to in-memory store.
 * If file does not exist, automatically creates it populated with seed data.
 */
async function loadDB(): Promise<LocalDBData> {
  try {
    const content = await fs.readFile(DB_FILE_PATH, "utf8");
    const parsed = JSON.parse(content) as LocalDBData;
    if (parsed && Array.isArray(parsed.tasks) && Array.isArray(parsed.activities)) {
      memoryStore = parsed;
      return parsed;
    }
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") {
      console.warn("[LocalStore] Warning reading local-db.json:", error.message);
      if (memoryStore) {
        return memoryStore;
      }
    }
  }

  // File doesn't exist or is invalid; initialize with fresh seed data
  const seedData = createInitialSeedData();
  memoryStore = seedData;
  await saveDB(seedData);
  return seedData;
}

/**
 * Persists DB data to `.data/local-db.json` and updates in-memory cache.
 */
async function saveDB(data: LocalDBData): Promise<void> {
  memoryStore = data;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    console.warn(
      "[LocalStore] Warning: could not write to .data/local-db.json (running in-memory mode):",
      error.message
    );
  }
}

/**
 * Returns complete board data formatted for the UI.
 */
export async function getLocalBoardData(): Promise<BoardDataResponse> {
  const db = await loadDB();

  // Attach up to 10 latest activities to each task and sort steps by position ASC
  const formattedTasks: Task[] = db.tasks.map((task) => {
    const taskActivities = db.activities
      .filter((a) => a.task_id === task.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    const sortedSteps = [...(task.steps || [])].sort((a, b) => a.position - b.position);

    return {
      ...task,
      steps: sortedSteps,
      activities: taskActivities,
    };
  });

  // Global activities sorted desc
  const allActivities = [...db.activities].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return {
    tasks: formattedTasks,
    activities: allActivities,
    storageMode: "local",
  };
}

/**
 * Resets local database with fresh seed data.
 */
export async function seedLocalData(): Promise<BoardDataResponse> {
  const freshData = createInitialSeedData();
  await saveDB(freshData);
  return getLocalBoardData();
}

/**
 * Creates a new task in local storage.
 */
export async function createLocalTask(input: CreateTaskInput): Promise<Task> {
  const db = await loadDB();
  const now = new Date().toISOString();
  const taskId = crypto.randomUUID();

  // Compute position at the end of the column
  const columnTasks = db.tasks.filter((t) => t.status === input.status);
  const position = columnTasks.length > 0 ? Math.max(...columnTasks.map((t) => t.position)) + 1 : 0;

  const initialStepsList = input.initialSteps || [];
  const steps: Step[] = initialStepsList.map((title, idx) => ({
    id: crypto.randomUUID(),
    task_id: taskId,
    title: title.trim(),
    done: false,
    done_at: null,
    position: idx,
  }));

  const newTask: Task = {
    id: taskId,
    title: input.title.trim(),
    category: input.category,
    status: input.status,
    waiting_for: input.waiting_for?.trim() || null,
    priority: input.priority || 2,
    due_date: input.due_date || null,
    note: input.note || null,
    position,
    created_at: now,
    updated_at: now,
    steps,
  };

  const activity: Activity = {
    id: crypto.randomUUID(),
    task_id: taskId,
    message: "สร้างงานใหม่",
    created_at: now,
  };

  newTask.activities = [activity];
  db.tasks.push(newTask);
  db.activities.unshift(activity);

  await saveDB(db);
  return newTask;
}

/**
 * Updates an existing task.
 */
export async function updateLocalTask(
  taskId: string,
  updates: UpdateTaskInput,
  customActivityMessage?: string
): Promise<Task> {
  const db = await loadDB();
  const index = db.tasks.findIndex((t) => t.id === taskId);
  if (index === -1) {
    throw new Error(`Task with id ${taskId} not found`);
  }

  const current = db.tasks[index];
  const now = new Date().toISOString();

  // Build activity message if needed
  let activityMsg = customActivityMessage;
  if (!activityMsg) {
    if (updates.status && updates.status !== current.status) {
      const fromLabel = STATUS_CONFIG[current.status]?.label || current.status;
      const toLabel = STATUS_CONFIG[updates.status]?.label || updates.status;
      activityMsg = `ย้ายจาก ${fromLabel} → ${toLabel}`;
    } else if (updates.waiting_for !== undefined && updates.waiting_for !== current.waiting_for) {
      if (updates.waiting_for) {
        activityMsg = `อัปเดตผู้รอผล: ${updates.waiting_for}`;
      } else {
        activityMsg = "ยกเลิกการรอผล";
      }
    } else {
      activityMsg = "แก้ไขข้อมูลงาน";
    }
  }

  const updatedTask: Task = {
    ...current,
    ...updates,
    updated_at: now,
  };

  db.tasks[index] = updatedTask;

  if (activityMsg) {
    const activity: Activity = {
      id: crypto.randomUUID(),
      task_id: taskId,
      message: activityMsg,
      created_at: now,
    };
    db.activities.unshift(activity);
    updatedTask.activities = [activity, ...(current.activities || [])].slice(0, 10);
  }

  await saveDB(db);
  return updatedTask;
}

/**
 * Deletes a task and its associated steps and activities.
 */
export async function deleteLocalTask(taskId: string): Promise<{ success: boolean }> {
  const db = await loadDB();
  db.tasks = db.tasks.filter((t) => t.id !== taskId);
  db.activities = db.activities.filter((a) => a.task_id !== taskId);
  await saveDB(db);
  return { success: true };
}

/**
 * Reorders tasks across columns and records move activity if specified.
 */
export async function reorderLocalTasks(
  items: ReorderTasksItem[],
  movedTaskActivity?: { taskId: string; fromStatus: TaskStatus; toStatus: TaskStatus }
): Promise<{ success: boolean }> {
  const db = await loadDB();
  const itemMap = new Map(items.map((i) => [i.id, i]));
  const now = new Date().toISOString();

  for (const task of db.tasks) {
    const item = itemMap.get(task.id);
    if (item) {
      task.status = item.status;
      task.position = item.position;
      task.updated_at = now;
    }
  }

  if (
    movedTaskActivity &&
    movedTaskActivity.fromStatus !== movedTaskActivity.toStatus
  ) {
    const fromLabel = STATUS_CONFIG[movedTaskActivity.fromStatus]?.label || movedTaskActivity.fromStatus;
    const toLabel = STATUS_CONFIG[movedTaskActivity.toStatus]?.label || movedTaskActivity.toStatus;
    const activity: Activity = {
      id: crypto.randomUUID(),
      task_id: movedTaskActivity.taskId,
      message: `ย้ายจาก ${fromLabel} → ${toLabel}`,
      created_at: now,
    };
    db.activities.unshift(activity);
  }

  await saveDB(db);
  return { success: true };
}

/**
 * Adds a single step to a task.
 */
export async function addLocalStep(taskId: string, title: string): Promise<Step> {
  const db = await loadDB();
  const task = db.tasks.find((t) => t.id === taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  const cleanTitle = title.trim();
  const position = (task.steps || []).length;
  const newStep: Step = {
    id: crypto.randomUUID(),
    task_id: taskId,
    title: cleanTitle,
    done: false,
    done_at: null,
    position,
  };

  task.steps = [...(task.steps || []), newStep];
  task.updated_at = new Date().toISOString();

  const activity: Activity = {
    id: crypto.randomUUID(),
    task_id: taskId,
    message: `เพิ่มขั้นตอน '${cleanTitle}'`,
    created_at: new Date().toISOString(),
  };
  db.activities.unshift(activity);

  await saveDB(db);
  return newStep;
}

/**
 * Adds multiple steps in bulk to a task.
 */
export async function addBulkLocalSteps(taskId: string, titles: string[]): Promise<Step[]> {
  const db = await loadDB();
  const task = db.tasks.find((t) => t.id === taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  const startPos = (task.steps || []).length;
  const addedSteps: Step[] = titles.map((title, idx) => ({
    id: crypto.randomUUID(),
    task_id: taskId,
    title: title.trim(),
    done: false,
    done_at: null,
    position: startPos + idx,
  }));

  task.steps = [...(task.steps || []), ...addedSteps];
  task.updated_at = new Date().toISOString();

  const activity: Activity = {
    id: crypto.randomUUID(),
    task_id: taskId,
    message: `เพิ่ม ${titles.length} ขั้นตอน`,
    created_at: new Date().toISOString(),
  };
  db.activities.unshift(activity);

  await saveDB(db);
  return addedSteps;
}

/**
 * Toggles done status of a step and checks if all steps of the parent task are done.
 */
export async function toggleLocalStep(
  stepId: string,
  done: boolean
): Promise<{ step: Step; allStepsDone: boolean }> {
  const db = await loadDB();
  let targetStep: Step | null = null;
  let targetTask: Task | null = null;

  for (const task of db.tasks) {
    const step = task.steps?.find((s) => s.id === stepId);
    if (step) {
      targetStep = step;
      targetTask = task;
      break;
    }
  }

  if (!targetStep || !targetTask) {
    throw new Error(`Step ${stepId} not found`);
  }

  const now = new Date().toISOString();
  targetStep.done = done;
  targetStep.done_at = done ? now : null;
  targetTask.updated_at = now;

  const activity: Activity = {
    id: crypto.randomUUID(),
    task_id: targetTask.id,
    message: done ? `ติ๊ก '${targetStep.title}' เสร็จ` : `ยกเลิกติ๊ก '${targetStep.title}'`,
    created_at: now,
  };
  db.activities.unshift(activity);

  const steps = targetTask.steps || [];
  const allStepsDone = steps.length > 0 && steps.every((s) => s.done);

  await saveDB(db);
  return { step: targetStep, allStepsDone };
}

/**
 * Updates step title.
 */
export async function updateLocalStepTitle(stepId: string, title: string): Promise<Step> {
  const db = await loadDB();
  for (const task of db.tasks) {
    const step = task.steps?.find((s) => s.id === stepId);
    if (step) {
      step.title = title.trim();
      task.updated_at = new Date().toISOString();
      await saveDB(db);
      return step;
    }
  }
  throw new Error(`Step ${stepId} not found`);
}

/**
 * Deletes a step and re-indexes remaining steps.
 */
export async function deleteLocalStep(stepId: string): Promise<{ success: boolean }> {
  const db = await loadDB();
  for (const task of db.tasks) {
    const stepIdx = task.steps?.findIndex((s) => s.id === stepId);
    if (stepIdx !== undefined && stepIdx !== -1) {
      task.steps.splice(stepIdx, 1);
      // Re-index remaining steps
      task.steps.forEach((s, idx) => {
        s.position = idx;
      });
      task.updated_at = new Date().toISOString();
      await saveDB(db);
      return { success: true };
    }
  }
  return { success: false };
}

/**
 * Reorders steps within a task.
 */
export async function reorderLocalSteps(
  taskId: string,
  items: ReorderStepsItem[]
): Promise<{ success: boolean }> {
  const db = await loadDB();
  const task = db.tasks.find((t) => t.id === taskId);
  if (!task || !task.steps) {
    return { success: false };
  }

  const itemMap = new Map(items.map((i) => [i.id, i.position]));
  for (const step of task.steps) {
    const pos = itemMap.get(step.id);
    if (pos !== undefined) {
      step.position = pos;
    }
  }
  task.steps.sort((a, b) => a.position - b.position);
  task.updated_at = new Date().toISOString();

  await saveDB(db);
  return { success: true };
}
