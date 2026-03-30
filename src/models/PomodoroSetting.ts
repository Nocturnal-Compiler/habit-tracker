import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPomodoroSetting extends Document {
  userId: mongoose.Types.ObjectId;
  focusMinutes: number;
  breakMinutes: number;
}

const PomodoroSettingSchema = new mongoose.Schema<IPomodoroSetting>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    focusMinutes: { type: Number, required: true, default: 25, min: 1, max: 180 },
    breakMinutes: { type: Number, required: true, default: 5, min: 1, max: 60 },
  },
  { timestamps: true }
);

PomodoroSettingSchema.index({ userId: 1 }, { unique: true });

const PomodoroSetting: Model<IPomodoroSetting> =
  mongoose.models.PomodoroSetting ||
  mongoose.model<IPomodoroSetting>("PomodoroSetting", PomodoroSettingSchema);

export default PomodoroSetting;
