import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProductVariant extends Document {
  productId: Types.ObjectId;
  size: "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL";
  color: string;
  colorHex: string;
  sku: string;
  stock: number;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    size: {
      type: String,
      enum: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
      required: true,
    },
    color: { type: String, required: true, trim: true },
    colorHex: { type: String, default: "#000000" },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    stock: { type: Number, default: 0, min: 0 },
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

productVariantSchema.index({ productId: 1 });
productVariantSchema.index({ sku: 1 }, { unique: true });
productVariantSchema.index(
  { productId: 1, size: 1, color: 1 },
  { unique: true }
);

const ProductVariant = mongoose.model<IProductVariant>(
  "ProductVariant",
  productVariantSchema
);
export default ProductVariant;
