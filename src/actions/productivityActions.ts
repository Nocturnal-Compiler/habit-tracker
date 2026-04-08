"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Deadline from "@/models/Deadline";
import TodayTask from "@/models/TodayTask";
import PomodoroSetting from "@/models/PomodoroSetting";
import PomodoroPreset from "@/models/PomodoroPreset";
import PomodoroSession from "@/models/PomodoroSession";

type SessionUser = {
  id?: string;
};

export type DeadlineItem = {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  priority?: "low" | "medium" | "high";
  tags?: string[];
  reminderAt?: string | null;
  category?: string | null;
};

export type TodayTaskItem = {
  id: string;
  text: string;
  done: boolean;
  estimateMinutes?: number;
  priority?: "low" | "medium" | "high";
  recurring?: "none" | "daily" | "weekly";
  timeOfDay?: string | null;
};

export type PomodoroSettings = {
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartNextSession: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function serializeDeadline(item: any): DeadlineItem {
  return {
    id: item._id.toString(),
    title: item.title,
    dueDate: item.dueDate,
    completed: Boolean(item.completed),
    priority: item.priority || "medium",
    tags: Array.isArray(item.tags) ? item.tags : [],
    reminderAt: item.reminderAt ? new Date(item.reminderAt).toISOString() : null,
    category: item.category ?? null,
  };
}

function serializeTodayTask(item: any): TodayTaskItem {
  return {
    id: item._id.toString(),
    text: item.text,
    done: Boolean(item.done),
    estimateMinutes: item.estimateMinutes ?? 0,
    priority: item.priority ?? "medium",
    recurring: item.recurring ?? "none",
    timeOfDay: item.timeOfDay ?? null,
  };
}

async function getOptionalUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return ((session.user as SessionUser).id ?? null) as string | null;
}

async function getRequiredUserId() {
  const userId = await getOptionalUserId();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function getDeadlines(): Promise<DeadlineItem[]> {
  const userId = await getOptionalUserId();
  if (!userId) return [];

  await connectToDatabase();
  const deadlines = await Deadline.find({ userId }).sort({ dueDate: 1, priority: -1, createdAt: -1 }).lean();
  return deadlines.map(serializeDeadline);
}

export async function createDeadline(
  title: string,
  dueDate: string,
  priority: "low" | "medium" | "high" = "medium",
  tags: string[] = [],
  reminderAt: string | null = null,
  category: string | null = null
): Promise<DeadlineItem> {
  const userId = await getRequiredUserId();
  const cleanTitle = title.trim();

  if (!cleanTitle) throw new Error("Title is required");
  if (!dueDate) throw new Error("Due date is required");

  await connectToDatabase();
  const created = await Deadline.create({
    userId,
    title: cleanTitle,
    dueDate,
    completed: false,
    priority,
    tags,
    reminderAt: reminderAt ? new Date(reminderAt) : undefined,
    category,
  });

  revalidatePath("/");
  revalidatePath("/deadlines");
  return serializeDeadline(created);
}

export async function updateDeadline(
  deadlineId: string,
  updates: Partial<{ title: string; dueDate: string; priority: string; tags: string[]; reminderAt: string | null; category: string | null; completed: boolean }>
): Promise<DeadlineItem> {
  const userId = await getRequiredUserId();

  await connectToDatabase();
  const deadline = await Deadline.findOne({ _id: deadlineId, userId });
  if (!deadline) throw new Error("Deadline not found");

  if (typeof updates.title === "string") deadline.title = updates.title.trim();
  if (typeof updates.dueDate === "string") deadline.dueDate = updates.dueDate;
  if (typeof updates.priority === "string") deadline.priority = updates.priority as any;
  if (Array.isArray(updates.tags)) deadline.tags = updates.tags;
  if (updates.reminderAt !== undefined) deadline.reminderAt = updates.reminderAt ? new Date(updates.reminderAt) : undefined;
  if (updates.category !== undefined) deadline.category = updates.category;
  if (typeof updates.completed === "boolean") deadline.completed = updates.completed;

  await deadline.save();

  revalidatePath("/");
  revalidatePath("/deadlines");
  return serializeDeadline(deadline);
}

export async function toggleDeadline(deadlineId: string): Promise<DeadlineItem> {
  const userId = await getRequiredUserId();

  await connectToDatabase();
  const deadline = await Deadline.findOne({ _id: deadlineId, userId });
  if (!deadline) throw new Error("Deadline not found");

  deadline.completed = !deadline.completed;
  await deadline.save();

  revalidatePath("/");
  revalidatePath("/deadlines");
  return serializeDeadline(deadline);
}

export async function deleteDeadline(deadlineId: string) {
  const userId = await getRequiredUserId();

  await connectToDatabase();
  await Deadline.deleteOne({ _id: deadlineId, userId });

  revalidatePath("/");
  revalidatePath("/deadlines");
  return { success: true };
}

export async function getTodayTasks(): Promise<TodayTaskItem[]> {
  const userId = await getOptionalUserId();
  if (!userId) return [];

  await connectToDatabase();
  const tasks = await TodayTask.find({ userId }).sort({ createdAt: -1 }).lean();
  return tasks.map(serializeTodayTask);
}

export async function createTodayTask(
  text: string,
  estimateMinutes: number = 0,
  priority: "low" | "medium" | "high" = "medium",
  recurring: "none" | "daily" | "weekly" = "none",
  timeOfDay: string | null = null
): Promise<TodayTaskItem> {
  const userId = await getRequiredUserId();
  const cleanText = text.trim();

  if (!cleanText) throw new Error("Task text is required");

  await connectToDatabase();
  const created = await TodayTask.create({
    userId,
    text: cleanText,
    done: false,
    estimateMinutes,
    priority,
    recurring,
    timeOfDay,
  });

  revalidatePath("/");
  revalidatePath("/today-tasks");
  return serializeTodayTask(created);
}

export async function updateTodayTask(
  taskId: string,
  updates: Partial<{ text: string; done: boolean; estimateMinutes: number; priority: string; recurring: string; timeOfDay: string | null }>
): Promise<TodayTaskItem> {
  const userId = await getRequiredUserId();

  await connectToDatabase();
  const task = await TodayTask.findOne({ _id: taskId, userId });
  if (!task) throw new Error("Task not found");

  if (typeof updates.text === "string") task.text = updates.text.trim();
  if (typeof updates.done === "boolean") task.done = updates.done;
  if (typeof updates.estimateMinutes === "number") task.estimateMinutes = updates.estimateMinutes;
  if (typeof updates.priority === "string") task.priority = updates.priority as any;
  if (typeof updates.recurring === "string") task.recurring = updates.recurring as any;
  if (updates.timeOfDay !== undefined) task.timeOfDay = updates.timeOfDay;

  await task.save();

  revalidatePath("/");
  revalidatePath("/today-tasks");
  return serializeTodayTask(task);
}

export async function toggleTodayTask(taskId: string): Promise<TodayTaskItem> {
  const userId = await getRequiredUserId();

  await connectToDatabase();
  const task = await TodayTask.findOne({ _id: taskId, userId });
  if (!task) throw new Error("Task not found");

  task.done = !task.done;
  await task.save();

  revalidatePath("/");
  revalidatePath("/today-tasks");
  return serializeTodayTask(task);
}

export async function deleteTodayTask(taskId: string) {
  const userId = await getRequiredUserId();

  await connectToDatabase();
  await TodayTask.deleteOne({ _id: taskId, userId });

  revalidatePath("/");
  revalidatePath("/today-tasks");
  return { success: true };
}

export async function getPomodoroSettings(): Promise<PomodoroSettings> {
  const userId = await getOptionalUserId();
  if (!userId) {
    return { focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4, autoStartNextSession: false };
  }

  await connectToDatabase();
  const settings = await PomodoroSetting.findOne({ userId }).lean();

  if (!settings) {
    return { focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4, autoStartNextSession: false };
  }

  return {
    focusMinutes: settings.focusMinutes,
    breakMinutes: settings.breakMinutes,
    longBreakMinutes: settings.longBreakMinutes ?? 15,
    sessionsBeforeLongBreak: settings.sessionsBeforeLongBreak ?? 4,
    autoStartNextSession: Boolean(settings.autoStartNextSession),
  };
}

export async function savePomodoroSettings(
  focusMinutes: number,
  breakMinutes: number,
  longBreakMinutes: number = 15,
  sessionsBeforeLongBreak: number = 4,
  autoStartNextSession: boolean = false
): Promise<PomodoroSettings> {
  const userId = await getRequiredUserId();

  const nextFocus = clamp(Math.round(focusMinutes), 1, 180);
  const nextBreak = clamp(Math.round(breakMinutes), 1, 60);
  const nextLongBreak = clamp(Math.round(longBreakMinutes), 1, 180);
  const nextSessions = clamp(Math.round(sessionsBeforeLongBreak), 1, 12);
  const nextAuto = Boolean(autoStartNextSession);

  await connectToDatabase();
  const settings = await PomodoroSetting.findOneAndUpdate(
    { userId },
    { focusMinutes: nextFocus, breakMinutes: nextBreak, longBreakMinutes: nextLongBreak, sessionsBeforeLongBreak: nextSessions, autoStartNextSession: nextAuto },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  revalidatePath("/");
  revalidatePath("/pomodoro");

  return {
    focusMinutes: settings.focusMinutes,
    breakMinutes: settings.breakMinutes,
    longBreakMinutes: settings.longBreakMinutes ?? 15,
    sessionsBeforeLongBreak: settings.sessionsBeforeLongBreak ?? 4,
    autoStartNextSession: Boolean(settings.autoStartNextSession),
  };
}

// Pomodoro presets and session logs
function serializePreset(item: any) {
  return {
    id: item._id.toString(),
    name: item.name,
    focusMinutes: item.focusMinutes,
    breakMinutes: item.breakMinutes,
    longBreakMinutes: item.longBreakMinutes,
    sessionsBeforeLongBreak: item.sessionsBeforeLongBreak,
  };
}

function serializeSession(item: any) {
  return {
    id: item._id.toString(),
    mode: item.mode,
    durationSeconds: item.durationSeconds,
    name: item.name || null,
    completedAt: item.completedAt ? new Date(item.completedAt).toISOString() : null,
  };
}

export async function getPomodoroPresets() {
  const userId = await getOptionalUserId();
  if (!userId) return [];

  await connectToDatabase();
  const presets = await PomodoroPreset.find({ userId }).sort({ createdAt: -1 }).lean();
  return presets.map(serializePreset);
}

export async function createPomodoroPreset(
  name: string,
  focusMinutes: number,
  breakMinutes: number,
  longBreakMinutes: number = 15,
  sessionsBeforeLongBreak: number = 4
) {
  const userId = await getRequiredUserId();
  const clean = name.trim();
  if (!clean) throw new Error("Preset name required");

  await connectToDatabase();
  const created = await PomodoroPreset.create({
    userId,
    name: clean,
    focusMinutes,
    breakMinutes,
    longBreakMinutes,
    sessionsBeforeLongBreak,
  });

  revalidatePath("/pomodoro");
  return serializePreset(created);
}

export async function deletePomodoroPreset(presetId: string) {
  const userId = await getRequiredUserId();
  await connectToDatabase();
  await PomodoroPreset.deleteOne({ _id: presetId, userId });
  revalidatePath("/pomodoro");
  return { success: true };
}

export async function logPomodoroSession(mode: "focus" | "break", durationSeconds: number, name?: string) {
  const userId = await getRequiredUserId();
  await connectToDatabase();
  const created = await PomodoroSession.create({ userId, mode, durationSeconds, name: name?.trim() || undefined, completedAt: new Date() });
  revalidatePath("/pomodoro");
  return serializeSession(created);
}

export async function getPomodoroSessions(limit: number = 50) {
  const userId = await getOptionalUserId();
  if (!userId) return [];

  await connectToDatabase();
  const list = await PomodoroSession.find({ userId }).sort({ completedAt: -1 }).limit(limit).lean();
  return list.map(serializeSession);
}
