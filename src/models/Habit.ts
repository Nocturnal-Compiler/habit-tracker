import mongoose, { Document, Model, Schema } from "mongoose";

export interface IHabit extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  category: "mind" | "body" | "focus";
  color: string;
  logs: string[]; // array of 'YYYY-MM-DD' dates when the habit was completed
  priority?: "low" | "medium" | "high";
  frequencyPerWeek?: number;
  startDate?: string | null; // yyyy-MM-dd
  tags?: string[];
  reminderTime?: string | null; // HH:mm
  active?: boolean;
}

const HabitSchema = new mongoose.Schema<IHabit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    category: { type: String, enum: ["mind", "body", "focus"], default: "focus" },
    color: { type: String, default: "from-indigo-400 to-cyan-400" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    frequencyPerWeek: { type: Number, required: false, default: 7, min: 0, max: 168 },
    startDate: { type: String, required: false },
    tags: { type: [String], default: [] },
    reminderTime: { type: String, required: false },
    active: { type: Boolean, default: true },
    logs: [{ type: String }],
  },
  { timestamps: true }
);

// Index to easily fetch a user's habits
HabitSchema.index({ userId: 1 });

const Habit: Model<IHabit> = mongoose.models.Habit || mongoose.model<IHabit>("Habit", HabitSchema);
export default Habit;