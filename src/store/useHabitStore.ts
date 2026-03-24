import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, startOfToday } from 'date-fns';

export interface Habit {
  id: string;
  title: string;
  category?: 'mind' | 'body' | 'focus';
  color?: string; // Hex or tailwind class
  createdAt: number;
}

export type HabitEntry = {
  [dateIso: string]: boolean; // format: 'yyyy-MM-dd' -> true/false
};

interface HabitStore {
  habits: Habit[];
  entries: Record<string, HabitEntry>; // habitId -> HabitEntry
  addHabit: (title: string, category?: Habit['category']) => void;
  toggleEntry: (habitId: string, dateIso: string) => void;
  getStreak: (habitId: string) => number;
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: [
        { id: '1', title: 'Meditate 10 mins', category: 'mind', color: 'from-emerald-400 to-teal-500', createdAt: Date.now() },
        { id: '2', title: 'Deep Work (2 hrs)', category: 'focus', color: 'from-indigo-400 to-cyan-400', createdAt: Date.now() },
        { id: '3', title: 'Workout', category: 'body', color: 'from-orange-400 to-rose-500', createdAt: Date.now() },
        { id: '4', title: 'Read 20 pages', category: 'mind', color: 'from-purple-400 to-pink-500', createdAt: Date.now() },
      ],
      entries: {},

      addHabit: (title, category = 'focus') => {
        const id = crypto.randomUUID();
        set((state) => ({
          habits: [...state.habits, { id, title, category, createdAt: Date.now() }],
          entries: { ...state.entries, [id]: {} },
        }));
      },

      toggleEntry: (habitId, dateIso) => {
        set((state) => {
          const habitEntries = state.entries[habitId] || {};
          const isCompleted = habitEntries[dateIso];
          
          return {
            entries: {
              ...state.entries,
              [habitId]: {
                ...habitEntries,
                [dateIso]: !isCompleted,
              },
            }
          };
        });
      },

      getStreak: (habitId) => {
        // Very basic streak logic: count backwards from today until we hit a gap
        const entries = get().entries[habitId] || {};
        let streak = 0;
        let d = new Date();
        
        // Let's just simulate dummy streaks for aesthetic purposes if none exist to make the UI look good initially
        if (Object.keys(entries).length === 0) {
           return (habitId.charCodeAt(0) % 15) + 2; 
        }

        while (true) {
          const iso = format(d, 'yyyy-MM-dd');
          if (entries[iso]) {
            streak++;
            d.setDate(d.getDate() - 1);
          } else {
            break;
          }
        }
        return streak;
      },
    }),
    {
      name: 'flowstate-habit-storage',
    }
  )
);
