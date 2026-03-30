import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDeadline extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  dueDate: string; // yyyy-MM-dd
  completed: boolean;
}

const DeadlineSchema = new mongoose.Schema<IDeadline>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    dueDate: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

DeadlineSchema.index({ userId: 1, completed: 1, dueDate: 1 });

const Deadline: Model<IDeadline> =
  mongoose.models.Deadline || mongoose.model<IDeadline>("Deadline", DeadlineSchema);

export default Deadline;
