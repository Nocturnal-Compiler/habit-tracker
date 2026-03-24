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

export async function createHabit(title: string, category: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  await connectToDatabase();
  const userId = (session.user as any).id;

  const newHabit = await Habit.create({
    userId,
    title,
    category,
    logs: []
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