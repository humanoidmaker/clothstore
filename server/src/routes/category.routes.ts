import { Router, Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate, validateQuery } from "../middleware/validate.js";
import { slugify } from "../utils/helpers.js";
import { logger } from "../config/logger.js";

const router = Router();

// ── Schemas ──────────────────────────────────────────────────────────

const categoryQuerySchema = z.object({
  tree: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().optional().default(""),
  image: z.string().trim().optional().default(""),
  parentId: z
    .string()
    .refine((v) => mongoose.Types.ObjectId.isValid(v), "Invalid parent ID")
    .optional()
    .nullable(),
});

const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().optional(),
  image: z.string().trim().optional(),
  parentId: z
    .string()
    .refine((v) => mongoose.Types.ObjectId.isValid(v), "Invalid parent ID")
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

// ── GET / ────────────────────────────────────────────────────────────

router.get("/", validateQuery(categoryQuerySchema), async (req: Request, res: Response) => {
  try {
    const { tree } = req.query as any;

    const categories = await Category.find({ isActive: true })
      .populate("parentId", "name slug")
      .sort({ name: 1 })
      .lean();

    if (tree) {
      // Build nested tree: parents with children array
      const categoryMap = new Map<string, any>();
      const roots: any[] = [];

      for (const cat of categories) {
        categoryMap.set(cat._id.toString(), { ...cat, children: [] });
      }

      for (const cat of categories) {
        const node = categoryMap.get(cat._id.toString());
        if (cat.parentId) {
          const parentKey =
            typeof cat.parentId === "object" && cat.parentId._id
              ? cat.parentId._id.toString()
              : cat.parentId.toString();
          const parent = categoryMap.get(parentKey);
          if (parent) {
            parent.children.push(node);
          } else {
            roots.push(node);
          }
        } else {
          roots.push(node);
        }
      }

      res.json({ success: true, data: { categories: roots } });
      return;
    }

    res.json({ success: true, data: { categories } });
  } catch (err) {
    logger.error(`List categories error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── GET /:slug ──────────────────────────────────────────────────────

router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true })
      .populate("parentId", "name slug")
      .lean();

    if (!category) {
      res.status(404).json({
        success: false,
        error: { code: "CATEGORY_NOT_FOUND", message: "Category not found" },
      });
      return;
    }

    // Subcategories
    const subcategories = await Category.find({ parentId: category._id, isActive: true })
      .sort({ name: 1 })
      .lean();

    // Product count (include subcategory products)
    const allCatIds = [category._id, ...subcategories.map((s) => s._id)];
    const productCount = await Product.countDocuments({
      categoryId: { $in: allCatIds },
      isActive: true,
    });

    res.json({
      success: true,
      data: {
        category: { ...category, subcategories, productCount },
      },
    });
  } catch (err) {
    logger.error(`Get category error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── POST / (Admin) ──────────────────────────────────────────────────

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createCategorySchema),
  async (req: Request, res: Response) => {
    try {
      const { name, description, image, parentId } = req.body;

      const slug = slugify(name);

      // Check slug uniqueness
      const existing = await Category.findOne({ slug });
      if (existing) {
        res.status(409).json({
          success: false,
          error: { code: "SLUG_EXISTS", message: "A category with this name already exists" },
        });
        return;
      }

      // Validate parent if provided
      if (parentId) {
        const parent = await Category.findById(parentId);
        if (!parent) {
          res.status(400).json({
            success: false,
            error: { code: "INVALID_PARENT", message: "Parent category not found" },
          });
          return;
        }
      }

      const category = await Category.create({
        name,
        slug,
        description,
        image,
        parentId: parentId || null,
      });

      res.status(201).json({
        success: true,
        data: { category },
        message: "Category created.",
      });
    } catch (err) {
      logger.error(`Create category error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      });
    }
  }
);

// ── PUT /:id (Admin) ────────────────────────────────────────────────

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(updateCategorySchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: { code: "INVALID_ID", message: "Invalid category ID" },
        });
        return;
      }

      const category = await Category.findById(id);
      if (!category) {
        res.status(404).json({
          success: false,
          error: { code: "CATEGORY_NOT_FOUND", message: "Category not found" },
        });
        return;
      }

      const updates = req.body;

      // If name changes, regenerate slug
      if (updates.name && updates.name !== category.name) {
        const newSlug = slugify(updates.name);
        const slugConflict = await Category.findOne({ slug: newSlug, _id: { $ne: category._id } });
        if (slugConflict) {
          res.status(409).json({
            success: false,
            error: { code: "SLUG_EXISTS", message: "A category with this name already exists" },
          });
          return;
        }
        updates.slug = newSlug;
      }

      // Validate parent if provided
      if (updates.parentId) {
        if (updates.parentId === id) {
          res.status(400).json({
            success: false,
            error: { code: "INVALID_PARENT", message: "Category cannot be its own parent" },
          });
          return;
        }
        const parent = await Category.findById(updates.parentId);
        if (!parent) {
          res.status(400).json({
            success: false,
            error: { code: "INVALID_PARENT", message: "Parent category not found" },
          });
          return;
        }
      }

      Object.assign(category, updates);
      await category.save();

      res.json({
        success: true,
        data: { category },
        message: "Category updated.",
      });
    } catch (err) {
      logger.error(`Update category error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      });
    }
  }
);

// ── DELETE /:id (Admin) ─────────────────────────────────────────────

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: { code: "INVALID_ID", message: "Invalid category ID" },
        });
        return;
      }

      const category = await Category.findById(id);
      if (!category) {
        res.status(404).json({
          success: false,
          error: { code: "CATEGORY_NOT_FOUND", message: "Category not found" },
        });
        return;
      }

      // Check for products using this category
      const productCount = await Product.countDocuments({ categoryId: category._id });
      if (productCount > 0) {
        res.status(409).json({
          success: false,
          error: {
            code: "CATEGORY_IN_USE",
            message: `Cannot delete: ${productCount} product(s) are assigned to this category`,
          },
        });
        return;
      }

      // Check for subcategories
      const subCount = await Category.countDocuments({ parentId: category._id });
      if (subCount > 0) {
        res.status(409).json({
          success: false,
          error: {
            code: "HAS_SUBCATEGORIES",
            message: `Cannot delete: ${subCount} subcategory(ies) belong to this category`,
          },
        });
        return;
      }

      await category.deleteOne();

      res.json({ success: true, message: "Category deleted." });
    } catch (err) {
      logger.error(`Delete category error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      });
    }
  }
);

export default router;
