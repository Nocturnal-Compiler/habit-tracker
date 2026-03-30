import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITodayTask extends Document {
  userId: mongoose.Types.ObjectId;
  text: string;
  done: boolean;
}

const TodayTaskSchema = new mongoose.Schema<ITodayTask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TodayTaskSchema.index({ userId: 1, done: 1 });

const TodayTask: Model<ITodayTask> =
  mongoose.models.TodayTask || mongoose.model<ITodayTask>("TodayTask", TodayTaskSchema);

export default TodayTask;
