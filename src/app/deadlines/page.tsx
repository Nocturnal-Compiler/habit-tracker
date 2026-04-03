import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import FluidBackground from "@/components/FluidBackground";
import DeadlineTracker from "@/components/DeadlineTracker";
import { getDeadlines } from "@/actions/productivityActions";

export default async function DeadlinesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const deadlines = await getDeadlines();

  return (
    <div className="min-h-screen text-zinc-50 relative overflow-hidden">
      <FluidBackground />
      <main className="relative z-10 px-4 sm:px-8 md:px-12 py-10 md:py-14">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <div>
              <DeadlineTracker initialItems={deadlines} variant="page" />
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <h4 className="text-sm font-semibold text-zinc-100">Filters & Quick Actions</h4>
                <p className="text-xs text-zinc-500">Use the tracker panel to manage deadlines; quick actions live there too.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <h4 className="text-sm font-semibold text-zinc-100">Tips</h4>
                <p className="text-xs text-zinc-500">Add tags and reminders via "More options" when adding deadlines.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
