import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPomodoroSession extends Document {
  userId: mongoose.Types.ObjectId;
  mode: "focus" | "break";
  durationSeconds: number;
  name?: string;
  completedAt: Date;
}

const PomodoroSessionSchema = new mongoose.Schema<IPomodoroSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mode: { type: String, enum: ["focus", "break"], required: true },
    durationSeconds: { type: Number, required: true },
    name: { type: String, trim: true },
    completedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

PomodoroSessionSchema.index({ userId: 1, completedAt: -1 });

const PomodoroSession: Model<IPomodoroSession> =
  mongoose.models.PomodoroSession || mongoose.model<IPomodoroSession>("PomodoroSession", PomodoroSessionSchema);

export default PomodoroSession;
