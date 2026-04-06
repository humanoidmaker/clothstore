import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAddress extends Document {
  userId: Types.ObjectId;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  type: "HOME" | "WORK" | "OTHER";
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
    type: {
      type: String,
      enum: ["HOME", "WORK", "OTHER"],
      default: "HOME",
    },
  },
  { timestamps: true }
);

addressSchema.index({ userId: 1 });

const Address = mongoose.model<IAddress>("Address", addressSchema);
export default Address;
