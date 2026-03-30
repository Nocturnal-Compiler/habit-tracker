import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardView from "@/components/DashboardView";
import { getHabits } from "@/actions/habitActions";
import { getDeadlines, getTodayTasks, getPomodoroSettings } from "@/actions/productivityActions";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const [habits, deadlines, todayTasks, pomodoroSettings] = await Promise.all([
    getHabits(),
    getDeadlines(),
    getTodayTasks(),
    getPomodoroSettings(),
  ]);

  return (
    <DashboardView
      initialHabits={habits}
      initialDeadlines={deadlines}
      initialTodayTasks={todayTasks}
      initialPomodoroSettings={pomodoroSettings}
    />
  );
}
