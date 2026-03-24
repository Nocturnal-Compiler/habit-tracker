import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardView from "@/components/DashboardView";
import { getHabits } from "@/actions/habitActions";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const habits = await getHabits();

  return <DashboardView initialHabits={habits} />;
}
