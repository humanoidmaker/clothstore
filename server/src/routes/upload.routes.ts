import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate } from "../middleware/auth.js";
import { logger } from "../config/logger.js";

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.resolve("public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config: memory storage
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpg, png, webp, gif) are allowed"));
    }
  },
});

// ── POST / — Upload single file ─────────────────────────────────────

router.post(
  "/",
  authenticate,
  (req: Request, res: Response, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({
            success: false,
            error: { code: "FILE_TOO_LARGE", message: "File size must be under 5MB" },
          });
          return;
        }
        res.status(400).json({
          success: false,
          error: { code: "UPLOAD_ERROR", message: err.message },
        });
        return;
      }
      if (err) {
        res.status(400).json({
          success: false,
          error: { code: "UPLOAD_ERROR", message: err.message },
        });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { code: "NO_FILE", message: "No file uploaded" },
        });
        return;
      }

      // Generate unique filename
      const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      const filePath = path.join(uploadDir, filename);

      // Write buffer to file
      fs.writeFileSync(filePath, req.file.buffer);

      res.status(201).json({
        success: true,
        data: { url: `/uploads/${filename}` },
        message: "File uploaded successfully",
      });
    } catch (err) {
      logger.error(`Upload error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to upload file" },
      });
    }
  }
);

export default router;
