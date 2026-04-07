"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Habit from "@/models/Habit";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getHabits() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return [];

  await connectToDatabase();
  const userId = (session.user as any).id;
  
  const habits = await Habit.find({ userId }).lean();
  
  // Serialize ObjectId to string for client component transmission
  return habits.map((h: any) => ({
    ...h,
    _id: h._id.toString(),
    userId: h.userId.toString()
  }));
}

export type CreateHabitOptions = {
  priority?: "low" | "medium" | "high";
  frequencyPerWeek?: number;
  startDate?: string | null; // yyyy-MM-dd
  tags?: string[];
  reminderTime?: string | null; // HH:mm
  color?: string | null;
};

export async function createHabit(title: string, category: string, options: CreateHabitOptions = {}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  await connectToDatabase();
  const userId = (session.user as any).id;

  const newHabit = await Habit.create({
    userId,
    title,
    category,
    color: options.color ?? undefined,
    priority: options.priority ?? undefined,
    frequencyPerWeek: typeof options.frequencyPerWeek === "number" ? options.frequencyPerWeek : undefined,
    startDate: options.startDate ?? undefined,
    tags: Array.isArray(options.tags) ? options.tags : [],
    reminderTime: options.reminderTime ?? undefined,
    logs: [],
    active: true,
  });

  revalidatePath("/");
  return { success: true, habitId: newHabit._id.toString() };
}

export async function toggleHabitLog(habitId: string, dateIso: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  await connectToDatabase();
  const userId = (session.user as any).id;

  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) throw new Error("Habit not found");

  const alreadyLogged = habit.logs.includes(dateIso);
  
  if (alreadyLogged) {
    habit.logs = habit.logs.filter((d: string) => d !== dateIso);
  } else {
    habit.logs.push(dateIso);
  }

  await habit.save();
  revalidatePath("/");
  return { success: true, logs: habit.logs };
}