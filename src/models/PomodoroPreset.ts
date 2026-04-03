import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPomodoroPreset extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
}

const PomodoroPresetSchema = new mongoose.Schema<IPomodoroPreset>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    focusMinutes: { type: Number, required: true, default: 25, min: 1, max: 180 },
    breakMinutes: { type: Number, required: true, default: 5, min: 1, max: 60 },
    longBreakMinutes: { type: Number, required: true, default: 15, min: 1, max: 180 },
    sessionsBeforeLongBreak: { type: Number, required: true, default: 4, min: 1, max: 12 },
  },
  { timestamps: true }
);

PomodoroPresetSchema.index({ userId: 1 });

const PomodoroPreset: Model<IPomodoroPreset> =
  mongoose.models.PomodoroPreset || mongoose.model<IPomodoroPreset>("PomodoroPreset", PomodoroPresetSchema);

export default PomodoroPreset;
