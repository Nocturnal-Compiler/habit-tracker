import mongoose, { Document, Model, Schema } from "mongoose";

export interface IHabit extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  category: "mind" | "body" | "focus";
  color: string;
  logs: string[]; // array of 'YYYY-MM-DD' dates when the habit was completed
}

const HabitSchema = new mongoose.Schema<IHabit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    category: { type: String, enum: ["mind", "body", "focus"], default: "focus" },
    color: { type: String, default: "from-indigo-400 to-cyan-400" },
    logs: [{ type: String }],
  },
  { timestamps: true }
);

// Index to easily fetch a user's habits
HabitSchema.index({ userId: 1 });

const Habit: Model<IHabit> = mongoose.models.Habit || mongoose.model<IHabit>("Habit", HabitSchema);
export default Habit;