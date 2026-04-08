<h1 align="center">Daily Flow & Protocol Matrix</h1>

<p align="center">
  A production-ready habit-tracking and productivity suite built to help you manage your daily protocols, upcoming deadlines, daily tasks, and focus sessions.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Features

- **Daily Flow (Protocol Tracker)**
  - Track and maintain streaks for your focus, mind, and body protocols.
  - Create advanced habits with custom priority, weekly frequency, start dates, tags, and reminder times.
  - Interactive, fluid animated UI with optimistic updates for immediate feedback.

- **Deadline Tracker**
  - Visualize your upcoming, due today, and overdue deadlines.
  - Tag deadlines, sort by priority, and easily mark them as complete.
  - Export your deadlines to CSV with a single click.

- **Today's Tasks**
  - Quickly capture and check off daily to-dos.
  - Add time estimates, recurring schedules, and prioritize what needs to be done.
  - One-click clear for completed tasks.

- **Advanced Pomodoro Timer**
  - Fully customizable focus intervals, short breaks, and long breaks.
  - Set specific sessions before long break triggers, and automatically start next sessions.
  - Save personalized presets and view historical logs of completed focus sessions.

- **Monthly Heatmap Matrix**
  - Analyze your consistency patterns over time in a beautiful heatmap visualization.

## Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org) with React
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database / ORM**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- Node.js (v18 or higher)
- npm, yarn, or pnpm
- A running MongoDB instance or MongoDB Atlas cluster URI

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/habit-tracker.git
   cd habit-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or yarn install / pnpm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and populate it with the following:
   ```env
   # MongoDB Connection String
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster...

   # Next Auth config
   NEXTAUTH_SECRET=your_super_secret_key_here
   NEXTAUTH_URL=http://localhost:3000

   # Add any OAuth providers if configured in src/lib/auth.ts (e.g., GitHub, Google)
   # GITHUB_ID=...
   # GITHUB_SECRET=...
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```bash
src/
├── actions/             # Next.js Server Actions (habitActions.ts, productivityActions.ts)
├── app/                 # Next.js App Router Pages and Layouts (including /api/auth)
├── components/          # Reusable React components (DashboardView, HabitCard, PomodoroTimer, etc.)
├── lib/                 # Utility functions, database connection, Auth configs
├── models/              # Mongoose schemas (Habit, Deadline, TodayTask, PomodoroSetting, etc.)
└── store/               # Zustand state stores (if applicable)
```

## Architecture Notes

- **Server-Backed with Optimistic UI**: Core operations (creating protocols, modifying tasks, logging pomodoro sessions) use Next.js server actions allowing for zero-API-route architecture where possible, while the UI responds instantly via optimistic updates before reconciling with the server state.
- **Variant Components**: Many components (like `DeadlineTracker.tsx`) support `widget` or `page` variants, displaying compactly on the dashboard or expanding via dedicated pages into dual-column layouts.

## License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.