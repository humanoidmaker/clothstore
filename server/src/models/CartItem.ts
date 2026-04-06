import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICartItem extends Document {
  userId: Types.ObjectId;
  variantId: Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { timestamps: true }
);

cartItemSchema.index({ userId: 1, variantId: 1 }, { unique: true });

const CartItem = mongoose.model<ICartItem>("CartItem", cartItemSchema);
export default CartItem;
