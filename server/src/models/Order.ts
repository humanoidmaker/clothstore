import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrderAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IStatusHistory {
  status: string;
  timestamp: Date;
  note: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: Types.ObjectId;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUND_REQUESTED"
    | "REFUNDED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  subtotal: number;
  tax: number;
  shippingCharge: number;
  discount: number;
  total: number;
  shippingAddress: IOrderAddress;
  billingAddress: IOrderAddress;
  couponCode: string;
  notes: string;
  statusHistory: IStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const addressSubSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  { _id: false }
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "REFUND_REQUESTED",
        "REFUNDED",
      ],
      default: "PENDING",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    paymentMethod: { type: String, default: "razorpay" },
    razorpayOrderId: { type: String, default: "", index: true },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    shippingAddress: { type: addressSubSchema, required: true },
    billingAddress: { type: addressSubSchema, required: true },
    couponCode: { type: String, default: "" },
    notes: { type: String, default: "" },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true }
);

orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ userId: 1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model<IOrder>("Order", orderSchema);
export default Order;
