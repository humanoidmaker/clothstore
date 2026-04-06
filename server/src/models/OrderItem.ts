import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrderItem extends Document {
  orderId: Types.ObjectId;
  variantId: Types.ObjectId;
  productName: string;
  productSlug: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
    },
    productName: { type: String, required: true },
    productSlug: { type: String, required: true },
    size: { type: String, required: true },
    color: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

orderItemSchema.index({ orderId: 1 });

const OrderItem = mongoose.model<IOrderItem>("OrderItem", orderItemSchema);
export default OrderItem;
