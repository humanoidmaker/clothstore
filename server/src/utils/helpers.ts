import slugifyPkg from "slugify";
import type { Pagination } from "../types/index.js";

export function slugify(text: string): string {
  return slugifyPkg(text, { lower: true, strict: true, trim: true });
}

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function paginationHelper(page: number, limit: number, total: number): Pagination {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export function formatPrice(paise: number): string {
  const rupees = paise / 100;
  return `\u20B9${rupees.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
