"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Deadline from "@/models/Deadline";
import TodayTask from "@/models/TodayTask";
import PomodoroSetting from "@/models/PomodoroSetting";

type SessionUser = {
  id?: string;
};

export type DeadlineItem = {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
};

export type TodayTaskItem = {
  id: string;
  text: string;
  done: boolean;
};

export type PomodoroSettings = {
  focusMinutes: number;
  breakMinutes: number;
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
  };
}

function serializeTodayTask(item: any): TodayTaskItem {
  return {
    id: item._id.toString(),
    text: item.text,
    done: Boolean(item.done),
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
  const deadlines = await Deadline.find({ userId }).sort({ dueDate: 1, createdAt: -1 }).lean();
  return deadlines.map(serializeDeadline);
}

export async function createDeadline(title: string, dueDate: string): Promise<DeadlineItem> {
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
  });

  revalidatePath("/");
  revalidatePath("/deadlines");
  return serializeDeadline(created);
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

export async function createTodayTask(text: string): Promise<TodayTaskItem> {
  const userId = await getRequiredUserId();
  const cleanText = text.trim();

  if (!cleanText) throw new Error("Task text is required");

  await connectToDatabase();
  const created = await TodayTask.create({
    userId,
    text: cleanText,
    done: false,
  });

  revalidatePath("/");
  revalidatePath("/today-tasks");
  return serializeTodayTask(created);
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
    return { focusMinutes: 25, breakMinutes: 5 };
  }

  await connectToDatabase();
  const settings = await PomodoroSetting.findOne({ userId }).lean();

  if (!settings) {
    return { focusMinutes: 25, breakMinutes: 5 };
  }

  return {
    focusMinutes: settings.focusMinutes,
    breakMinutes: settings.breakMinutes,
  };
}

export async function savePomodoroSettings(
  focusMinutes: number,
  breakMinutes: number
): Promise<PomodoroSettings> {
  const userId = await getRequiredUserId();

  const nextFocus = clamp(Math.round(focusMinutes), 1, 180);
  const nextBreak = clamp(Math.round(breakMinutes), 1, 60);

  await connectToDatabase();
  const settings = await PomodoroSetting.findOneAndUpdate(
    { userId },
    { focusMinutes: nextFocus, breakMinutes: nextBreak },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  revalidatePath("/");
  revalidatePath("/pomodoro");

  return {
    focusMinutes: settings.focusMinutes,
    breakMinutes: settings.breakMinutes,
  };
}
