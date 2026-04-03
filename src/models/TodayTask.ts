import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITodayTask extends Document {
  userId: mongoose.Types.ObjectId;
  text: string;
  done: boolean;
  estimateMinutes?: number;
  priority?: "low" | "medium" | "high";
  recurring?: "none" | "daily" | "weekly";
  timeOfDay?: string | null;
}

const TodayTaskSchema = new mongoose.Schema<ITodayTask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
    estimateMinutes: { type: Number, required: false, default: 0, min: 0 },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    recurring: { type: String, enum: ["none", "daily", "weekly"], default: "none" },
    timeOfDay: { type: String, required: false },
  },
  { timestamps: true }
);

TodayTaskSchema.index({ userId: 1, done: 1 });

const TodayTask: Model<ITodayTask> =
  mongoose.models.TodayTask || mongoose.model<ITodayTask>("TodayTask", TodayTaskSchema);

export default TodayTask;
