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
          <DeadlineTracker initialItems={deadlines} variant="page" />
        </div>
      </main>
    </div>
  );
}
