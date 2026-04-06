import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string;
  role: "CUSTOMER" | "ADMIN";
  emailVerified: boolean;
  emailOTP: string;
  emailOTPExpiry: Date;
  resetOTP: string;
  resetOTPExpiry: Date;
  refreshToken: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" },
    role: {
      type: String,
      enum: ["CUSTOMER", "ADMIN"],
      default: "CUSTOMER",
    },
    emailVerified: { type: Boolean, default: false },
    emailOTP: { type: String, select: false },
    emailOTPExpiry: { type: Date, select: false },
    resetOTP: { type: String, select: false },
    resetOTPExpiry: { type: Date, select: false },
    refreshToken: { type: String, select: false },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

userSchema.virtual("fullName").get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

const User = mongoose.model<IUser>("User", userSchema);
export default User;
