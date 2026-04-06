import mongoose, { Schema, Document } from "mongoose";

export interface INewsletter extends Document {
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const newsletterSchema = new Schema<INewsletter>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

newsletterSchema.index({ email: 1 }, { unique: true });

const Newsletter = mongoose.model<INewsletter>("Newsletter", newsletterSchema);
export default Newsletter;
