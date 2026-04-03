import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPomodoroSetting extends Document {
  userId: mongoose.Types.ObjectId;
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartNextSession: boolean;
}

const PomodoroSettingSchema = new mongoose.Schema<IPomodoroSetting>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    focusMinutes: { type: Number, required: true, default: 25, min: 1, max: 180 },
    breakMinutes: { type: Number, required: true, default: 5, min: 1, max: 60 },
    longBreakMinutes: { type: Number, required: true, default: 15, min: 1, max: 180 },
    sessionsBeforeLongBreak: { type: Number, required: true, default: 4, min: 1, max: 12 },
    autoStartNextSession: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

PomodoroSettingSchema.index({ userId: 1 }, { unique: true });

const PomodoroSetting: Model<IPomodoroSetting> =
  mongoose.models.PomodoroSetting ||
  mongoose.model<IPomodoroSetting>("PomodoroSetting", PomodoroSettingSchema);

export default PomodoroSetting;
