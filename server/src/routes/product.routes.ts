import { Router, Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import ProductVariant from "../models/ProductVariant.js";
import Category from "../models/Category.js";
import Review from "../models/Review.js";
import { validateQuery } from "../middleware/validate.js";
import { paginationHelper } from "../utils/helpers.js";
import { logger } from "../config/logger.js";

const router = Router();

// ── Schemas ──────────────────────────────────────────────────────────

const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sizes: z.string().optional(),
  colors: z.string().optional(),
  brands: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  sort: z
    .enum(["newest", "price-asc", "price-desc", "rating", "popular"])
    .default("newest"),
  inStock: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
});

const reviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ── Sort mapping ─────────────────────────────────────────────────────

const sortMap: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  rating: { avgRating: -1 },
  popular: { reviewCount: -1, avgRating: -1 },
};

// ── GET / ────────────────────────────────────────────────────────────

router.get("/", validateQuery(productQuerySchema), async (req: Request, res: Response) => {
  try {
    const {
      page,
      limit,
      category,
      search,
      minPrice,
      maxPrice,
      sizes,
      colors,
      brands,
      rating,
      sort,
      inStock,
    } = req.query as any;

    const filter: Record<string, any> = { isActive: true };

    // Category filter
    if (category) {
      const cat = await Category.findOne({ slug: category, isActive: true });
      if (cat) {
        // Include subcategories
        const subcats = await Category.find({ parentId: cat._id, isActive: true }).select("_id");
        const catIds = [cat._id, ...subcats.map((s) => s._id)];
        filter.categoryId = { $in: catIds };
      } else {
        // No matching category — return empty
        res.json({ success: true, data: { products: [] }, pagination: paginationHelper(page, limit, 0) });
        return;
      }
    }

    // Text search
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: regex }, { brand: regex }, { description: regex }];
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // Brand filter
    if (brands) {
      const brandList = brands.split(",").map((b: string) => b.trim()).filter(Boolean);
      if (brandList.length) {
        filter.brand = { $in: brandList.map((b: string) => new RegExp(`^${b}$`, "i")) };
      }
    }

    // Rating filter
    if (rating !== undefined) {
      filter.avgRating = { $gte: rating };
    }

    // Sizes / colors / inStock — requires variant lookup
    let variantProductIds: mongoose.Types.ObjectId[] | null = null;

    if (sizes || colors || inStock === true) {
      const variantFilter: Record<string, any> = {};

      if (sizes) {
        const sizeList = sizes.split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean);
        if (sizeList.length) variantFilter.size = { $in: sizeList };
      }

      if (colors) {
        const colorList = colors.split(",").map((c: string) => c.trim()).filter(Boolean);
        if (colorList.length) {
          variantFilter.color = { $in: colorList.map((c: string) => new RegExp(`^${c}$`, "i")) };
        }
      }

      if (inStock === true) {
        variantFilter.stock = { $gt: 0 };
      }

      const matchingVariants = await ProductVariant.find(variantFilter).distinct("productId");
      variantProductIds = matchingVariants;
    }

    // inStock=false means products with zero stock across all variants
    if (inStock === false) {
      const inStockProductIds = await ProductVariant.find({ stock: { $gt: 0 } }).distinct("productId");
      filter._id = { ...(filter._id || {}), $nin: inStockProductIds };
    }

    if (variantProductIds !== null) {
      if (filter._id) {
        filter._id = { ...filter._id, $in: variantProductIds };
      } else {
        filter._id = { $in: variantProductIds };
      }
    }

    const sortOption = sortMap[sort] || sortMap.newest;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate("categoryId", "name slug")
        .lean(),
      Product.countDocuments(filter),
    ]);

    // Attach variants to each product
    const productIds = products.map((p) => p._id);
    const variants = await ProductVariant.find({ productId: { $in: productIds } }).lean();
    const variantsByProduct = new Map<string, typeof variants>();
    for (const v of variants) {
      const key = v.productId.toString();
      if (!variantsByProduct.has(key)) variantsByProduct.set(key, []);
      variantsByProduct.get(key)!.push(v);
    }

    const productsWithVariants = products.map((p) => ({
      ...p,
      variants: variantsByProduct.get(p._id.toString()) || [],
    }));

    res.json({
      success: true,
      data: { products: productsWithVariants },
      pagination: paginationHelper(page, limit, total),
    });
  } catch (err) {
    logger.error(`List products error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── GET /featured ───────────────────────────────────────────────────

router.get("/featured", async (_req: Request, res: Response) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("categoryId", "name slug")
      .lean();

    const productIds = products.map((p) => p._id);
    const variants = await ProductVariant.find({ productId: { $in: productIds } }).lean();
    const variantsByProduct = new Map<string, typeof variants>();
    for (const v of variants) {
      const key = v.productId.toString();
      if (!variantsByProduct.has(key)) variantsByProduct.set(key, []);
      variantsByProduct.get(key)!.push(v);
    }

    const productsWithVariants = products.map((p) => ({
      ...p,
      variants: variantsByProduct.get(p._id.toString()) || [],
    }));

    res.json({ success: true, data: { products: productsWithVariants } });
  } catch (err) {
    logger.error(`Featured products error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── GET /new-arrivals ───────────────────────────────────────────────

router.get("/new-arrivals", async (_req: Request, res: Response) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("categoryId", "name slug")
      .lean();

    const productIds = products.map((p) => p._id);
    const variants = await ProductVariant.find({ productId: { $in: productIds } }).lean();
    const variantsByProduct = new Map<string, typeof variants>();
    for (const v of variants) {
      const key = v.productId.toString();
      if (!variantsByProduct.has(key)) variantsByProduct.set(key, []);
      variantsByProduct.get(key)!.push(v);
    }

    const productsWithVariants = products.map((p) => ({
      ...p,
      variants: variantsByProduct.get(p._id.toString()) || [],
    }));

    res.json({ success: true, data: { products: productsWithVariants } });
  } catch (err) {
    logger.error(`New arrivals error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── GET /:slug ──────────────────────────────────────────────────────

router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate("categoryId", "name slug image")
      .lean();

    if (!product) {
      res.status(404).json({
        success: false,
        error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" },
      });
      return;
    }

    const variants = await ProductVariant.find({ productId: product._id }).lean();

    // Related products — same category, exclude current
    const related = await Product.find({
      categoryId: product.categoryId,
      _id: { $ne: product._id },
      isActive: true,
    })
      .sort({ avgRating: -1 })
      .limit(4)
      .populate("categoryId", "name slug")
      .lean();

    const relatedIds = related.map((p) => p._id);
    const relatedVariants = await ProductVariant.find({ productId: { $in: relatedIds } }).lean();
    const relatedVarMap = new Map<string, typeof relatedVariants>();
    for (const v of relatedVariants) {
      const key = v.productId.toString();
      if (!relatedVarMap.has(key)) relatedVarMap.set(key, []);
      relatedVarMap.get(key)!.push(v);
    }

    const relatedWithVariants = related.map((p) => ({
      ...p,
      variants: relatedVarMap.get(p._id.toString()) || [],
    }));

    res.json({
      success: true,
      data: {
        product: { ...product, variants },
        relatedProducts: relatedWithVariants,
      },
    });
  } catch (err) {
    logger.error(`Get product error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── GET /:slug/reviews ──────────────────────────────────────────────

router.get("/:slug/reviews", validateQuery(reviewQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as any;

    const product = await Product.findOne({ slug: req.params.slug }).select("_id").lean();
    if (!product) {
      res.status(404).json({
        success: false,
        error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" },
      });
      return;
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ productId: product._id })
        .populate("userId", "firstName lastName avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ productId: product._id }),
    ]);

    res.json({
      success: true,
      data: { reviews },
      pagination: paginationHelper(page, limit, total),
    });
  } catch (err) {
    logger.error(`Get reviews error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

export default router;
