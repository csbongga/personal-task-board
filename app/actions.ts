"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  addBulkLocalSteps,
  addLocalStep,
  createLocalTask,
  deleteLocalStep,
  deleteLocalTask,
  getLocalBoardData,
  reorderLocalSteps,
  reorderLocalTasks,
  seedLocalData,
  toggleLocalStep,
  updateLocalStepTitle,
  updateLocalTask,
} from "@/lib/local-store";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { INITIAL_SEED_TASKS } from "@/lib/templates";
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
} from "@/lib/types";

/**
 * Helper to record activity safely in Supabase.
 */
async function recordSupabaseActivity(taskId: string, message: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("activity").insert({
      task_id: taskId,
      message,
    });
  } catch (err) {
    console.warn("[Actions] Failed to record Supabase activity:", err);
  }
}

/**
 * Seeds Supabase with the 7 initial tasks defined in INITIAL_SEED_TASKS.
 */
async function seedSupabaseDataInternal(): Promise<BoardDataResponse> {
  const supabase = getSupabaseAdmin();

  // Delete all tasks (cascade removes steps & activities)
  await supabase.from("tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  for (const seed of INITIAL_SEED_TASKS) {
    const { data: taskData, error: taskError } = await supabase
      .from("tasks")
      .insert({
        title: seed.title,
        category: seed.category,
        status: seed.status,
        waiting_for: seed.waiting_for,
        priority: seed.priority,
        position: seed.position,
      })
      .select()
      .single();

    if (taskError || !taskData) {
      console.error("[Actions] Error inserting seed task:", taskError);
      continue;
    }

    const stepsToInsert = seed.steps.map((st, idx) => ({
      task_id: taskData.id,
      title: st.title,
      done: st.done,
      done_at: st.done ? new Date().toISOString() : null,
      position: idx,
    }));

    if (stepsToInsert.length > 0) {
      await supabase.from("steps").insert(stepsToInsert);
    }

    await supabase.from("activity").insert({
      task_id: taskData.id,
      message: "สร้างงานเริ่มต้นตามระบบ",
    });
  }

  return fetchSupabaseBoardData();
}

/**
 * Fetches all board tasks, steps, and activities from Supabase.
 */
async function fetchSupabaseBoardData(): Promise<BoardDataResponse> {
  const supabase = getSupabaseAdmin();

  const [tasksRes, stepsRes, activitiesRes] = await Promise.all([
    supabase.from("tasks").select("*").order("position", { ascending: true }),
    supabase.from("steps").select("*").order("position", { ascending: true }),
    supabase
      .from("activity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  if (tasksRes.error) {
    throw tasksRes.error;
  }

  const tasksList: Task[] = (tasksRes.data || []).map((t) => {
    const taskSteps = (stepsRes.data || [])
      .filter((s) => s.task_id === t.id)
      .sort((a, b) => a.position - b.position);

    const taskActivities = (activitiesRes.data || [])
      .filter((a) => a.task_id === t.id)
      .slice(0, 10);

    return {
      id: t.id,
      title: t.title,
      category: t.category,
      status: t.status,
      waiting_for: t.waiting_for,
      priority: t.priority,
      due_date: t.due_date,
      note: t.note,
      position: t.position,
      created_at: t.created_at,
      updated_at: t.updated_at,
      steps: taskSteps,
      activities: taskActivities,
    };
  });

  return {
    tasks: tasksList,
    activities: (activitiesRes.data || []) as Activity[],
    storageMode: "supabase",
  };
}

/**
 * Action: Load board data.
 * Auto-seeds with initial 7 tasks if empty on first load.
 */
export async function getBoardDataAction(): Promise<BoardDataResponse> {
  if (isSupabaseConfigured()) {
    try {
      const data = await fetchSupabaseBoardData();
      if (data.tasks.length === 0) {
        // Auto-seed Supabase on first run if database is completely empty
        return await seedSupabaseDataInternal();
      }
      return data;
    } catch (err) {
      console.warn(
        "[Actions] Failed to query Supabase, falling back to Local Store:",
        err
      );
      return getLocalBoardData();
    }
  }

  return getLocalBoardData();
}

/**
 * Action: Seed or re-seed initial 7 tasks.
 */
export async function seedInitialDataAction(): Promise<BoardDataResponse> {
  let result: BoardDataResponse;
  if (isSupabaseConfigured()) {
    try {
      result = await seedSupabaseDataInternal();
    } catch (err) {
      console.warn("[Actions] Supabase seed failed, falling back to local:", err);
      result = await seedLocalData();
    }
  } else {
    result = await seedLocalData();
  }

  revalidatePath("/");
  return result;
}

/**
 * Action: Create a new task.
 */
export async function createTaskAction(input: CreateTaskInput): Promise<Task> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();

      // Find max position in the column
      const { data: posData } = await supabase
        .from("tasks")
        .select("position")
        .eq("status", input.status)
        .order("position", { ascending: false })
        .limit(1);

      const nextPosition =
        posData && posData.length > 0 ? posData[0].position + 1 : 0;

      const { data: newTask, error: taskError } = await supabase
        .from("tasks")
        .insert({
          title: input.title.trim(),
          category: input.category,
          status: input.status,
          waiting_for: input.waiting_for?.trim() || null,
          priority: input.priority || 2,
          due_date: input.due_date || null,
          note: input.note?.trim() || null,
          position: nextPosition,
        })
        .select()
        .single();

      if (taskError || !newTask) {
        throw taskError || new Error("Failed to insert task");
      }

      let insertedSteps: Step[] = [];
      const initialTitles = input.initialSteps || [];
      if (initialTitles.length > 0) {
        const stepsToInsert = initialTitles.map((t, idx) => ({
          task_id: newTask.id,
          title: t.trim(),
          done: false,
          position: idx,
        }));

        const { data: createdSteps } = await supabase
          .from("steps")
          .insert(stepsToInsert)
          .select();

        insertedSteps = (createdSteps as Step[]) || [];
      }

      const activityMsg = "สร้างงานใหม่";
      const { data: activityData } = await supabase
        .from("activity")
        .insert({
          task_id: newTask.id,
          message: activityMsg,
        })
        .select()
        .single();

      revalidatePath("/");

      return {
        ...newTask,
        steps: insertedSteps,
        activities: activityData ? [activityData] : [],
      };
    } catch (err) {
      console.warn("[Actions] Supabase createTask failed, falling back to local:", err);
      const res = await createLocalTask(input);
      revalidatePath("/");
      return res;
    }
  }

  const task = await createLocalTask(input);
  revalidatePath("/");
  return task;
}

/**
 * Action: Update an existing task.
 */
export async function updateTaskAction(
  taskId: string,
  updates: UpdateTaskInput,
  customActivityMessage?: string
): Promise<Task> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();

      // Retrieve current state to compare status / waiting_for
      const { data: currentTask } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      let activityMsg = customActivityMessage;
      if (!activityMsg && currentTask) {
        if (updates.status && updates.status !== currentTask.status) {
          const fromLabel = STATUS_CONFIG[currentTask.status as TaskStatus]?.label || currentTask.status;
          const toLabel = STATUS_CONFIG[updates.status]?.label || updates.status;
          activityMsg = `ย้ายจาก ${fromLabel} → ${toLabel}`;
        } else if (
          updates.waiting_for !== undefined &&
          updates.waiting_for !== currentTask.waiting_for
        ) {
          activityMsg = updates.waiting_for
            ? `อัปเดตผู้รอผล: ${updates.waiting_for}`
            : "ยกเลิกการรอผล";
        } else {
          activityMsg = "แก้ไขข้อมูลงาน";
        }
      }

      const { data: updatedTask, error: updateError } = await supabase
        .from("tasks")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId)
        .select()
        .single();

      if (updateError || !updatedTask) {
        throw updateError || new Error("Failed to update task");
      }

      if (activityMsg) {
        await recordSupabaseActivity(taskId, activityMsg);
      }

      // Fetch task steps
      const { data: steps } = await supabase
        .from("steps")
        .select("*")
        .eq("task_id", taskId)
        .order("position", { ascending: true });

      // Fetch task activities
      const { data: activities } = await supabase
        .from("activity")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false })
        .limit(10);

      revalidatePath("/");

      return {
        ...updatedTask,
        steps: (steps as Step[]) || [],
        activities: (activities as Activity[]) || [],
      };
    } catch (err) {
      console.warn("[Actions] Supabase updateTask failed, falling back to local:", err);
      const res = await updateLocalTask(taskId, updates, customActivityMessage);
      revalidatePath("/");
      return res;
    }
  }

  const task = await updateLocalTask(taskId, updates, customActivityMessage);
  revalidatePath("/");
  return task;
}

/**
 * Action: Delete a task.
 */
export async function deleteTaskAction(taskId: string): Promise<{ success: boolean }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) {
        throw error;
      }
      revalidatePath("/");
      return { success: true };
    } catch (err) {
      console.warn("[Actions] Supabase deleteTask failed, falling back to local:", err);
      const res = await deleteLocalTask(taskId);
      revalidatePath("/");
      return res;
    }
  }

  const res = await deleteLocalTask(taskId);
  revalidatePath("/");
  return res;
}

/**
 * Action: Reorder multiple tasks across columns.
 */
export async function reorderTasksAction(
  items: ReorderTasksItem[],
  movedTaskActivity?: { taskId: string; fromStatus: TaskStatus; toStatus: TaskStatus }
): Promise<{ success: boolean }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();

      // Parallel batch updates for position & status
      await Promise.all(
        items.map((item) =>
          supabase
            .from("tasks")
            .update({
              status: item.status,
              position: item.position,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.id)
        )
      );

      if (
        movedTaskActivity &&
        movedTaskActivity.fromStatus !== movedTaskActivity.toStatus
      ) {
        const fromLabel =
          STATUS_CONFIG[movedTaskActivity.fromStatus]?.label ||
          movedTaskActivity.fromStatus;
        const toLabel =
          STATUS_CONFIG[movedTaskActivity.toStatus]?.label ||
          movedTaskActivity.toStatus;
        await recordSupabaseActivity(
          movedTaskActivity.taskId,
          `ย้ายจาก ${fromLabel} → ${toLabel}`
        );
      }

      revalidatePath("/");
      return { success: true };
    } catch (err) {
      console.warn("[Actions] Supabase reorderTasks failed, falling back to local:", err);
      const res = await reorderLocalTasks(items, movedTaskActivity);
      revalidatePath("/");
      return res;
    }
  }

  const res = await reorderLocalTasks(items, movedTaskActivity);
  revalidatePath("/");
  return res;
}

/**
 * Action: Add a single step to a task.
 */
export async function addStepAction(taskId: string, title: string): Promise<Step> {
  const cleanTitle = title.trim();

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();

      const { data: posData } = await supabase
        .from("steps")
        .select("position")
        .eq("task_id", taskId)
        .order("position", { ascending: false })
        .limit(1);

      const nextPos = posData && posData.length > 0 ? posData[0].position + 1 : 0;

      const { data: step, error } = await supabase
        .from("steps")
        .insert({
          task_id: taskId,
          title: cleanTitle,
          done: false,
          position: nextPos,
        })
        .select()
        .single();

      if (error || !step) {
        throw error || new Error("Failed to insert step");
      }

      await recordSupabaseActivity(taskId, `เพิ่มขั้นตอน '${cleanTitle}'`);
      revalidatePath("/");
      return step as Step;
    } catch (err) {
      console.warn("[Actions] Supabase addStep failed, falling back to local:", err);
      const res = await addLocalStep(taskId, cleanTitle);
      revalidatePath("/");
      return res;
    }
  }

  const res = await addLocalStep(taskId, cleanTitle);
  revalidatePath("/");
  return res;
}

/**
 * Action: Add multiple steps in bulk.
 */
export async function addBulkStepsAction(
  taskId: string,
  titles: string[]
): Promise<Step[]> {
  const cleanTitles = titles.map((t) => t.trim()).filter(Boolean);
  if (cleanTitles.length === 0) return [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();

      const { data: posData } = await supabase
        .from("steps")
        .select("position")
        .eq("task_id", taskId)
        .order("position", { ascending: false })
        .limit(1);

      const startPos = posData && posData.length > 0 ? posData[0].position + 1 : 0;

      const stepsToInsert = cleanTitles.map((title, idx) => ({
        task_id: taskId,
        title,
        done: false,
        position: startPos + idx,
      }));

      const { data: inserted, error } = await supabase
        .from("steps")
        .insert(stepsToInsert)
        .select();

      if (error || !inserted) {
        throw error || new Error("Failed to insert bulk steps");
      }

      await recordSupabaseActivity(
        taskId,
        `เพิ่ม ${cleanTitles.length} ขั้นตอน`
      );
      revalidatePath("/");
      return inserted as Step[];
    } catch (err) {
      console.warn("[Actions] Supabase addBulkSteps failed, falling back to local:", err);
      const res = await addBulkLocalSteps(taskId, cleanTitles);
      revalidatePath("/");
      return res;
    }
  }

  const res = await addBulkLocalSteps(taskId, cleanTitles);
  revalidatePath("/");
  return res;
}

/**
 * Action: Toggle step done status and check if all steps are completed.
 */
export async function toggleStepAction(
  stepId: string,
  done: boolean
): Promise<{ step: Step; allStepsDone: boolean }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const now = new Date().toISOString();

      const { data: step, error } = await supabase
        .from("steps")
        .update({
          done,
          done_at: done ? now : null,
        })
        .eq("id", stepId)
        .select()
        .single();

      if (error || !step) {
        throw error || new Error("Failed to toggle step");
      }

      // Check whether all steps of this task are done
      const { data: allSteps } = await supabase
        .from("steps")
        .select("done")
        .eq("task_id", step.task_id);

      const stepsList = allSteps || [];
      const allStepsDone =
        stepsList.length > 0 && stepsList.every((s) => s.done);

      await recordSupabaseActivity(
        step.task_id,
        done ? `ติ๊ก '${step.title}' เสร็จ` : `ยกเลิกติ๊ก '${step.title}'`
      );

      revalidatePath("/");
      return { step: step as Step, allStepsDone };
    } catch (err) {
      console.warn("[Actions] Supabase toggleStep failed, falling back to local:", err);
      const res = await toggleLocalStep(stepId, done);
      revalidatePath("/");
      return res;
    }
  }

  const res = await toggleLocalStep(stepId, done);
  revalidatePath("/");
  return res;
}

/**
 * Action: Update step title.
 */
export async function updateStepTitleAction(
  stepId: string,
  title: string
): Promise<Step> {
  const cleanTitle = title.trim();

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: step, error } = await supabase
        .from("steps")
        .update({ title: cleanTitle })
        .eq("id", stepId)
        .select()
        .single();

      if (error || !step) {
        throw error || new Error("Failed to update step title");
      }

      revalidatePath("/");
      return step as Step;
    } catch (err) {
      console.warn("[Actions] Supabase updateStepTitle failed, falling back to local:", err);
      const res = await updateLocalStepTitle(stepId, cleanTitle);
      revalidatePath("/");
      return res;
    }
  }

  const res = await updateLocalStepTitle(stepId, cleanTitle);
  revalidatePath("/");
  return res;
}

/**
 * Action: Delete a step.
 */
export async function deleteStepAction(stepId: string): Promise<{ success: boolean }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("steps").delete().eq("id", stepId);
      if (error) {
        throw error;
      }
      revalidatePath("/");
      return { success: true };
    } catch (err) {
      console.warn("[Actions] Supabase deleteStep failed, falling back to local:", err);
      const res = await deleteLocalStep(stepId);
      revalidatePath("/");
      return res;
    }
  }

  const res = await deleteLocalStep(stepId);
  revalidatePath("/");
  return res;
}

/**
 * Action: Reorder steps within a task.
 */
export async function reorderStepsAction(
  taskId: string,
  items: ReorderStepsItem[]
): Promise<{ success: boolean }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      await Promise.all(
        items.map((item) =>
          supabase
            .from("steps")
            .update({ position: item.position })
            .eq("id", item.id)
            .eq("task_id", taskId)
        )
      );

      revalidatePath("/");
      return { success: true };
    } catch (err) {
      console.warn("[Actions] Supabase reorderSteps failed, falling back to local:", err);
      const res = await reorderLocalSteps(taskId, items);
      revalidatePath("/");
      return res;
    }
  }

  const res = await reorderLocalSteps(taskId, items);
  revalidatePath("/");
  return res;
}

/**
 * Action: Verify access PIN and set HTTP-only cookie if valid.
 */
export async function verifyPinAction(
  pin: string
): Promise<{ success: boolean; error?: string } | boolean> {
  const requiredPin = process.env.ACCESS_PIN?.trim();
  const inputPin = pin.trim();

  // If no PIN is set in environment, allow any or empty
  if (!requiredPin || inputPin === requiredPin) {
    const cookieStore = await cookies();
    cookieStore.set("task_board_pin", inputPin || "ok", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return { success: true };
  }

  return { success: false, error: "รหัส PIN ไม่ถูกต้อง" };
}
