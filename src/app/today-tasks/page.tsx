import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import FluidBackground from "@/components/FluidBackground";
import TodayTasks from "@/components/TodayTasks";
import { getTodayTasks } from "@/actions/productivityActions";

export default async function TodayTasksPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const tasks = await getTodayTasks();

  return (
    <div className="min-h-screen text-zinc-50 relative overflow-hidden">
      <FluidBackground />
      <main className="relative z-10 px-4 sm:px-8 md:px-12 py-10 md:py-14">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <div>
              <TodayTasks initialTasks={tasks} variant="page" />
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <h4 className="text-sm font-semibold text-zinc-100">Summary</h4>
                <p className="text-xs text-zinc-500">View task counts, estimates and quick batch actions in the main panel.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <h4 className="text-sm font-semibold text-zinc-100">Recurring</h4>
                <p className="text-xs text-zinc-500">Set recurring schedules when adding tasks to automate repeats.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
