import mongoose from "mongoose";
import { config } from "./config/env.js";
import { hashPassword } from "./utils/password.js";

import User from "./models/User.js";
import Address from "./models/Address.js";
import Category from "./models/Category.js";
import Product from "./models/Product.js";
import ProductVariant from "./models/ProductVariant.js";
import Review from "./models/Review.js";
import Coupon from "./models/Coupon.js";
import Order from "./models/Order.js";
import OrderItem from "./models/OrderItem.js";
import CartItem from "./models/CartItem.js";
import Wishlist from "./models/Wishlist.js";
import Newsletter from "./models/Newsletter.js";

// ───────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeImage(name: string): string {
  return `https://placehold.co/600x800/EEE/333?text=${encodeURIComponent(name)}`;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function generateOrderNumber(index: number): string {
  const prefix = "CS";
  const timestamp = Date.now().toString(36).toUpperCase();
  const seq = String(index + 1).padStart(4, "0");
  return `${prefix}-${timestamp}-${seq}`;
}

// ───────────────────────────────────────────────────
// Seed Data Definitions
// ───────────────────────────────────────────────────

interface ColorDef {
  name: string;
  hex: string;
}

interface ProductDef {
  name: string;
  brand: string;
  price: number;
  compareAtPrice: number | null;
  categorySlug: string;
  subcategorySlug: string;
  material: string;
  careInstructions: string;
  description: string;
  shortDescription: string;
  sizes: string[];
  colors: ColorDef[];
  isFeatured: boolean;
}

const COLORS: Record<string, ColorDef> = {
  Navy: { name: "Navy", hex: "#1a1f36" },
  White: { name: "White", hex: "#FFFFFF" },
  Olive: { name: "Olive", hex: "#556B2F" },
  Black: { name: "Black", hex: "#000000" },
  Indigo: { name: "Indigo", hex: "#3F51B5" },
  Mustard: { name: "Mustard", hex: "#E1AD01" },
  Sage: { name: "Sage", hex: "#87AE73" },
  Maroon: { name: "Maroon", hex: "#800000" },
  Teal: { name: "Teal", hex: "#008080" },
  Coral: { name: "Coral", hex: "#FF6F61" },
  Grey: { name: "Grey", hex: "#808080" },
  Beige: { name: "Beige", hex: "#F5F5DC" },
  Charcoal: { name: "Charcoal", hex: "#36454F" },
  Red: { name: "Red", hex: "#DC143C" },
  Blue: { name: "Blue", hex: "#2196F3" },
  Pink: { name: "Pink", hex: "#FFC0CB" },
  Green: { name: "Green", hex: "#2E7D32" },
  Brown: { name: "Brown", hex: "#795548" },
  Wine: { name: "Wine", hex: "#722F37" },
  Cream: { name: "Cream", hex: "#FFFDD0" },
  Peach: { name: "Peach", hex: "#FFCBA4" },
  Lavender: { name: "Lavender", hex: "#B39DDB" },
  SkyBlue: { name: "Sky Blue", hex: "#87CEEB" },
  Rust: { name: "Rust", hex: "#B7410E" },
  DarkGreen: { name: "Dark Green", hex: "#1B5E20" },
  LightBlue: { name: "Light Blue", hex: "#ADD8E6" },
  Yellow: { name: "Yellow", hex: "#FFD700" },
  Orange: { name: "Orange", hex: "#FF9800" },
  Silver: { name: "Silver", hex: "#C0C0C0" },
  Gold: { name: "Gold", hex: "#c8a96e" },
  Tan: { name: "Tan", hex: "#D2B48C" },
};

const productDefs: ProductDef[] = [
  // ─── MEN > T-SHIRTS ─────────────────────────────
  {
    name: "Allen Solly Premium Cotton T-Shirt",
    brand: "Allen Solly",
    price: 899,
    compareAtPrice: 1299,
    categorySlug: "men",
    subcategorySlug: "t-shirts",
    material: "100% Combed Cotton",
    careInstructions: "Machine wash cold. Do not bleach. Tumble dry low.",
    description:
      "Crafted from premium combed cotton, this Allen Solly t-shirt offers unbeatable comfort for everyday wear. The classic round neck and relaxed fit make it perfect for casual outings, weekend brunches, or just lounging at home. The fabric is pre-shrunk and retains its shape wash after wash.",
    shortDescription: "Premium cotton tee with a classic fit for everyday comfort.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [COLORS.Navy, COLORS.White, COLORS.Olive],
    isFeatured: true,
  },
  {
    name: "UCB Graphic Print T-Shirt",
    brand: "UCB",
    price: 799,
    compareAtPrice: null,
    categorySlug: "men",
    subcategorySlug: "t-shirts",
    material: "Cotton Blend",
    careInstructions: "Machine wash cold. Wash inside out.",
    description:
      "Make a statement with this bold graphic print t-shirt from United Colors of Benetton. Featuring a contemporary print on soft cotton blend fabric, this tee pairs perfectly with jeans or chinos for a casual, trendy look.",
    shortDescription: "Bold graphic tee for a casual, trendy look.",
    sizes: ["S", "M", "L", "XL"],
    colors: [COLORS.Black, COLORS.White, COLORS.Grey],
    isFeatured: false,
  },
  {
    name: "H&M Oversized Cotton T-Shirt",
    brand: "H&M",
    price: 699,
    compareAtPrice: 999,
    categorySlug: "men",
    subcategorySlug: "t-shirts",
    material: "100% Organic Cotton",
    careInstructions: "Machine wash at 40°C. Iron on medium heat.",
    description:
      "This oversized t-shirt from H&M is made with organic cotton for a soft, breathable feel. The dropped shoulders and relaxed fit give it a modern streetwear vibe. Perfect for layering or wearing on its own.",
    shortDescription: "Organic cotton oversized tee with a modern streetwear vibe.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [COLORS.Beige, COLORS.Black, COLORS.SkyBlue],
    isFeatured: false,
  },
  // ─── MEN > SHIRTS ────────────────────────────────
  {
    name: "Peter England Formal Check Shirt",
    brand: "Peter England",
    price: 1299,
    compareAtPrice: 1799,
    categorySlug: "men",
    subcategorySlug: "shirts",
    material: "Cotton Poly Blend",
    careInstructions: "Machine wash cold. Iron on medium heat.",
    description:
      "A classic check pattern formal shirt by Peter England, designed for the modern professional. The cotton-poly blend ensures a crisp look throughout the day with minimal wrinkling. Features a regular fit collar and single-button cuffs.",
    shortDescription: "Classic check formal shirt for the modern professional.",
    sizes: ["M", "L", "XL", "XXL"],
    colors: [COLORS.Blue, COLORS.White, COLORS.Grey],
    isFeatured: true,
  },
  {
    name: "Van Heusen Slim Fit Oxford Shirt",
    brand: "Van Heusen",
    price: 1599,
    compareAtPrice: null,
    categorySlug: "men",
    subcategorySlug: "shirts",
    material: "100% Cotton Oxford",
    careInstructions: "Machine wash cold. Hang dry. Iron on medium heat.",
    description:
      "This Van Heusen Oxford shirt is a wardrobe essential. Crafted from fine cotton oxford fabric with a slim fit silhouette, button-down collar, and chest pocket. Perfect for smart-casual occasions, office wear, or weekend outings.",
    shortDescription: "Slim fit Oxford shirt, a smart-casual wardrobe essential.",
    sizes: ["S", "M", "L", "XL"],
    colors: [COLORS.LightBlue, COLORS.White, COLORS.Pink],
    isFeatured: false,
  },
  {
    name: "Louis Philippe Linen Shirt",
    brand: "Louis Philippe",
    price: 2499,
    compareAtPrice: 3299,
    categorySlug: "men",
    subcategorySlug: "shirts",
    material: "100% Pure Linen",
    careInstructions: "Dry clean recommended. Iron while damp.",
    description:
      "Experience effortless elegance with this premium linen shirt from Louis Philippe. The natural linen fabric is breathable and perfect for Indian summers. Features a spread collar, French placket, and a relaxed yet refined fit.",
    shortDescription: "Premium linen shirt for effortless summer elegance.",
    sizes: ["M", "L", "XL", "XXL"],
    colors: [COLORS.White, COLORS.Beige, COLORS.SkyBlue],
    isFeatured: true,
  },
  // ─── MEN > JEANS ─────────────────────────────────
  {
    name: "Levi's 511 Slim Fit Jeans",
    brand: "Levi's",
    price: 2999,
    compareAtPrice: null,
    categorySlug: "men",
    subcategorySlug: "jeans",
    material: "98% Cotton, 2% Elastane",
    careInstructions: "Machine wash cold inside out. Do not tumble dry.",
    description:
      "The iconic Levi's 511 sits below the waist with a slim fit from hip to ankle. Made with premium stretch denim for all-day comfort without sacrificing style. A versatile pair that works from Monday to Sunday.",
    shortDescription: "Iconic slim fit jeans with stretch for all-day comfort.",
    sizes: ["S", "M", "L", "XL"],
    colors: [COLORS.Indigo, COLORS.Black],
    isFeatured: true,
  },
  {
    name: "Wrangler Classic Straight Jeans",
    brand: "Wrangler",
    price: 2499,
    compareAtPrice: 2999,
    categorySlug: "men",
    subcategorySlug: "jeans",
    material: "100% Cotton Denim",
    careInstructions: "Machine wash cold. Wash inside out.",
    description:
      "Built tough for everyday wear, these Wrangler straight fit jeans feature classic five-pocket styling, a comfortable mid-rise, and durable 100% cotton denim that gets better with every wash.",
    shortDescription: "Durable straight fit jeans for everyday wear.",
    sizes: ["M", "L", "XL", "XXL"],
    colors: [COLORS.Blue, COLORS.Charcoal, COLORS.Black],
    isFeatured: false,
  },
  // ─── MEN > TROUSERS ──────────────────────────────
  {
    name: "Park Avenue Slim Fit Chinos",
    brand: "Park Avenue",
    price: 1799,
    compareAtPrice: null,
    categorySlug: "men",
    subcategorySlug: "trousers",
    material: "Cotton Twill",
    careInstructions: "Machine wash cold. Do not bleach.",
    description:
      "These slim fit chinos from Park Avenue offer the perfect balance of comfort and style. Made from soft cotton twill with a hint of stretch, they transition effortlessly from office to evening plans.",
    shortDescription: "Slim fit chinos that work from office to evening.",
    sizes: ["M", "L", "XL", "XXL"],
    colors: [COLORS.Beige, COLORS.Navy, COLORS.Olive],
    isFeatured: false,
  },
  {
    name: "ColorPlus Casual Trousers",
    brand: "ColorPlus",
    price: 1499,
    compareAtPrice: 1999,
    categorySlug: "men",
    subcategorySlug: "trousers",
    material: "Cotton Stretch",
    careInstructions: "Machine wash cold. Iron on low heat.",
    description:
      "Relaxed yet refined, these ColorPlus casual trousers are crafted from breathable cotton stretch fabric. The mid-rise, regular fit is perfect for everyday comfort with a polished look.",
    shortDescription: "Relaxed cotton stretch trousers for everyday polish.",
    sizes: ["M", "L", "XL"],
    colors: [COLORS.Brown, COLORS.Grey, COLORS.Charcoal],
    isFeatured: false,
  },
  // ─── MEN > KURTAS ────────────────────────────────
  {
    name: "FabIndia Handloom Cotton Kurta",
    brand: "FabIndia",
    price: 1499,
    compareAtPrice: null,
    categorySlug: "men",
    subcategorySlug: "kurtas",
    material: "100% Handloom Cotton",
    careInstructions: "Hand wash separately. Dry in shade.",
    description:
      "This FabIndia kurta is crafted from handloom cotton by traditional Indian weavers. The natural texture, mandarin collar, and relaxed fit embody the perfect blend of tradition and contemporary style. Ideal for festivals, family gatherings, or casual ethnic wear.",
    shortDescription: "Handloom cotton kurta blending tradition with modern style.",
    sizes: ["M", "L", "XL", "XXL"],
    colors: [COLORS.Indigo, COLORS.Mustard, COLORS.Sage],
    isFeatured: true,
  },
  {
    name: "Manyavar Silk Blend Kurta Set",
    brand: "Manyavar",
    price: 3999,
    compareAtPrice: 5499,
    categorySlug: "men",
    subcategorySlug: "kurtas",
    material: "Silk Blend",
    careInstructions: "Dry clean only.",
    description:
      "Make a grand impression at any celebration with this Manyavar silk blend kurta set. Features intricate embroidery on the neckline and cuffs, paired with matching churidar pants. The rich fabric and royal design are perfect for weddings and festive occasions.",
    shortDescription: "Silk blend kurta set with embroidery for festive occasions.",
    sizes: ["M", "L", "XL", "XXL"],
    colors: [COLORS.Maroon, COLORS.Gold, COLORS.Cream],
    isFeatured: true,
  },
  {
    name: "Raymond Linen Kurta",
    brand: "Raymond",
    price: 2299,
    compareAtPrice: null,
    categorySlug: "men",
    subcategorySlug: "kurtas",
    material: "Pure Linen",
    careInstructions: "Dry clean recommended.",
    description:
      "A refined linen kurta from Raymond, featuring a classic straight cut, mandarin collar, and side slits. The lightweight linen fabric is perfect for warm weather and brings effortless sophistication to any ethnic outfit.",
    shortDescription: "Refined linen kurta with a classic straight cut.",
    sizes: ["M", "L", "XL"],
    colors: [COLORS.White, COLORS.Beige, COLORS.SkyBlue],
    isFeatured: false,
  },
  // ─── MEN > JACKETS ───────────────────────────────
  {
    name: "Zara Bomber Jacket",
    brand: "Zara",
    price: 3499,
    compareAtPrice: 4999,
    categorySlug: "men",
    subcategorySlug: "jackets",
    material: "Polyester Shell, Satin Lining",
    careInstructions: "Dry clean only.",
    description:
      "A stylish bomber jacket from Zara featuring a ribbed collar, cuffs, and hem. The sleek polyester shell with satin lining gives it a premium feel. Perfect for layering during transitional seasons or cool evenings.",
    shortDescription: "Sleek bomber jacket for a premium layered look.",
    sizes: ["S", "M", "L", "XL"],
    colors: [COLORS.Black, COLORS.Navy, COLORS.Olive],
    isFeatured: false,
  },
  {
    name: "Allen Solly Lightweight Denim Jacket",
    brand: "Allen Solly",
    price: 2799,
    compareAtPrice: null,
    categorySlug: "men",
    subcategorySlug: "jackets",
    material: "100% Cotton Denim",
    careInstructions: "Machine wash cold. Do not bleach.",
    description:
      "A timeless denim jacket from Allen Solly. This lightweight classic features a button-front closure, chest flap pockets, and a slightly tailored fit. An essential layering piece for every man's wardrobe.",
    shortDescription: "Timeless lightweight denim jacket for essential layering.",
    sizes: ["M", "L", "XL", "XXL"],
    colors: [COLORS.Blue, COLORS.Black],
    isFeatured: false,
  },
  // ─── WOMEN > DRESSES ─────────────────────────────
  {
    name: "AND Floral Midi Dress",
    brand: "AND",
    price: 2199,
    compareAtPrice: 2999,
    categorySlug: "women",
    subcategorySlug: "dresses",
    material: "Viscose Rayon",
    careInstructions: "Hand wash cold. Do not wring. Dry in shade.",
    description:
      "A beautiful floral midi dress from AND that is perfect for brunches, daytime events, or casual outings. The viscose rayon fabric drapes elegantly, while the A-line silhouette flatters all body types. Features a V-neckline and short flutter sleeves.",
    shortDescription: "Elegant floral midi dress with A-line silhouette.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [COLORS.Coral, COLORS.Navy, COLORS.Mustard],
    isFeatured: true,
  },
  {
    name: "H&M Bodycon Ribbed Dress",
    brand: "H&M",
    price: 1299,
    compareAtPrice: null,
    categorySlug: "women",
    subcategorySlug: "dresses",
    material: "Cotton Rib Knit",
    careInstructions: "Machine wash cold. Lay flat to dry.",
    description:
      "A figure-hugging ribbed bodycon dress from H&M. The stretchy cotton rib knit offers comfort and a flattering fit. Features a round neck and midi length. Style it with sneakers for day or heels for evening.",
    shortDescription: "Figure-hugging ribbed bodycon dress for day or evening.",
    sizes: ["XS", "S", "M", "L"],
    colors: [COLORS.Black, COLORS.Grey, COLORS.Olive],
    isFeatured: false,
  },
  // ─── WOMEN > TOPS ────────────────────────────────
  {
    name: "Global Desi Printed Peplum Top",
    brand: "Global Desi",
    price: 999,
    compareAtPrice: 1499,
    categorySlug: "women",
    subcategorySlug: "tops",
    material: "Viscose",
    careInstructions: "Hand wash cold. Iron on low heat.",
    description:
      "Add a pop of color to your wardrobe with this Global Desi printed peplum top. The peplum waist creates a flattering silhouette, while the vibrant print adds a playful touch. Pairs beautifully with jeans or palazzo pants.",
    shortDescription: "Printed peplum top with a flattering silhouette.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [COLORS.Teal, COLORS.Coral, COLORS.Mustard],
    isFeatured: false,
  },
  {
    name: "Zara Satin Blouse",
    brand: "Zara",
    price: 1899,
    compareAtPrice: null,
    categorySlug: "women",
    subcategorySlug: "tops",
    material: "Satin",
    careInstructions: "Dry clean recommended.",
    description:
      "Elevate your workwear with this luxurious satin blouse from Zara. Features a V-neckline, long sleeves with button cuffs, and a relaxed drape. The smooth satin fabric looks effortlessly polished with trousers or skirts.",
    shortDescription: "Luxurious satin blouse for polished workwear.",
    sizes: ["XS", "S", "M", "L"],
    colors: [COLORS.White, COLORS.Black, COLORS.Peach],
    isFeatured: false,
  },
  // ─── WOMEN > SAREES ──────────────────────────────
  {
    name: "FabIndia Chanderi Silk Saree",
    brand: "FabIndia",
    price: 4999,
    compareAtPrice: 6999,
    categorySlug: "women",
    subcategorySlug: "sarees",
    material: "Chanderi Silk",
    careInstructions: "Dry clean only. Store in muslin wrap.",
    description:
      "A gorgeous Chanderi silk saree from FabIndia, handwoven by artisans in Madhya Pradesh. The lightweight, translucent fabric features traditional butis and a rich zari border. Perfect for festivals, pujas, and elegant gatherings. Comes with an unstitched blouse piece.",
    shortDescription: "Handwoven Chanderi silk saree with traditional zari border.",
    sizes: ["M"],
    colors: [COLORS.Gold, COLORS.Maroon, COLORS.Teal],
    isFeatured: true,
  },
  {
    name: "Libas Georgette Printed Saree",
    brand: "Libas",
    price: 1999,
    compareAtPrice: 2799,
    categorySlug: "women",
    subcategorySlug: "sarees",
    material: "Georgette",
    careInstructions: "Dry clean only.",
    description:
      "This beautiful georgette saree from Libas features an all-over digital print that is contemporary yet timeless. The lightweight georgette drapes beautifully and is easy to manage. Includes a matching blouse piece.",
    shortDescription: "Lightweight georgette saree with contemporary digital print.",
    sizes: ["M"],
    colors: [COLORS.Pink, COLORS.Blue, COLORS.Green],
    isFeatured: false,
  },
  // ─── WOMEN > LEHENGAS ────────────────────────────
  {
    name: "Biba Embroidered Lehenga Choli Set",
    brand: "Biba",
    price: 6999,
    compareAtPrice: 9999,
    categorySlug: "women",
    subcategorySlug: "lehengas",
    material: "Art Silk with Net Dupatta",
    careInstructions: "Dry clean only. Handle with care.",
    description:
      "Turn heads at every celebration with this stunning embroidered lehenga choli set from Biba. The art silk lehenga features intricate thread work and sequin embellishments, paired with a matching choli and a sheer net dupatta with scalloped edges.",
    shortDescription: "Stunning embroidered lehenga set for celebrations.",
    sizes: ["S", "M", "L", "XL"],
    colors: [COLORS.Maroon, COLORS.Navy, COLORS.DarkGreen],
    isFeatured: false,
  },
  // ─── WOMEN > JEANS ───────────────────────────────
  {
    name: "Levi's High Rise Skinny Jeans",
    brand: "Levi's",
    price: 3299,
    compareAtPrice: null,
    categorySlug: "women",
    subcategorySlug: "jeans-women",
    material: "Stretch Denim",
    careInstructions: "Machine wash cold. Do not tumble dry.",
    description:
      "The Levi's High Rise Skinny is designed to flatter, hold, and lift. Made with super stretch denim that hugs your curves and stays comfortable all day. The high rise sits at the smallest part of your waist for a figure-defining look.",
    shortDescription: "High rise skinny jeans that flatter and hold all day.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [COLORS.Indigo, COLORS.Black, COLORS.Grey],
    isFeatured: false,
  },
  {
    name: "H&M Mom Jeans",
    brand: "H&M",
    price: 1999,
    compareAtPrice: 2499,
    categorySlug: "women",
    subcategorySlug: "jeans-women",
    material: "100% Cotton Denim",
    careInstructions: "Machine wash cold inside out.",
    description:
      "Relaxed, high-waisted mom jeans from H&M with a tapered leg. Made from 100% cotton denim with an authentic vintage wash. Features a classic five-pocket design and zip fly. Effortlessly cool for everyday styling.",
    shortDescription: "Relaxed high-waisted mom jeans with vintage wash.",
    sizes: ["XS", "S", "M", "L"],
    colors: [COLORS.Blue, COLORS.LightBlue],
    isFeatured: false,
  },
  // ─── WOMEN > KURTIS ──────────────────────────────
  {
    name: "Biba Embroidered Anarkali Kurti",
    brand: "Biba",
    price: 1799,
    compareAtPrice: 2499,
    categorySlug: "women",
    subcategorySlug: "kurtis",
    material: "Rayon",
    careInstructions: "Hand wash separately. Dry in shade.",
    description:
      "A beautifully embroidered Anarkali kurti from Biba. The flared silhouette with thread embroidery on the yoke and sleeves adds a festive charm to your everyday ethnic wear. Made from soft rayon for a comfortable, flowing drape.",
    shortDescription: "Embroidered Anarkali kurti with festive charm.",
    sizes: ["S", "M", "L", "XL"],
    colors: [COLORS.Maroon, COLORS.Teal, COLORS.Coral],
    isFeatured: false,
  },
  {
    name: "W Printed Straight Kurti",
    brand: "W",
    price: 1299,
    compareAtPrice: null,
    categorySlug: "women",
    subcategorySlug: "kurtis",
    material: "Cotton",
    careInstructions: "Machine wash cold. Iron on medium heat.",
    description:
      "A versatile printed kurti from W with a straight-cut silhouette. The contemporary print and comfortable cotton fabric make it perfect for daily wear. Features a round neck, three-quarter sleeves, and side slits.",
    shortDescription: "Versatile printed cotton kurti for daily wear.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [COLORS.Blue, COLORS.Mustard, COLORS.Rust],
    isFeatured: false,
  },
  {
    name: "Aurelia Chanderi Kurti",
    brand: "Aurelia",
    price: 1599,
    compareAtPrice: 2199,
    categorySlug: "women",
    subcategorySlug: "kurtis",
    material: "Chanderi Cotton",
    careInstructions: "Hand wash separately. Dry in shade.",
    description:
      "This Aurelia Chanderi kurti features a beautiful self-woven pattern in lightweight Chanderi cotton. The V-neck, three-quarter sleeves, and A-line cut create an elegant look perfect for office, lunch dates, or festive wear.",
    shortDescription: "Chanderi cotton kurti with elegant A-line cut.",
    sizes: ["S", "M", "L", "XL"],
    colors: [COLORS.Lavender, COLORS.Peach, COLORS.SkyBlue],
    isFeatured: false,
  },
  // ─── KIDS > BOYS ─────────────────────────────────
  {
    name: "Allen Solly Junior Boys Polo T-Shirt",
    brand: "Allen Solly",
    price: 599,
    compareAtPrice: 799,
    categorySlug: "kids",
    subcategorySlug: "boys",
    material: "Cotton Pique",
    careInstructions: "Machine wash cold. Do not bleach.",
    description:
      "A classic polo t-shirt for boys from Allen Solly Junior. Made from soft cotton pique fabric with the brand's signature logo embroidered on the chest. Perfect for school, play, or casual outings.",
    shortDescription: "Classic cotton polo tee for boys.",
    sizes: ["S", "M", "L", "XL"],
    colors: [COLORS.Navy, COLORS.Red, COLORS.White],
    isFeatured: false,
  },
  {
    name: "UCB Kids Cargo Shorts",
    brand: "UCB",
    price: 699,
    compareAtPrice: null,
    categorySlug: "kids",
    subcategorySlug: "boys",
    material: "100% Cotton Twill",
    careInstructions: "Machine wash cold.",
    description:
      "Durable and fun, these cargo shorts from UCB Kids feature multiple pockets and an elastic waistband for comfort. Made from sturdy cotton twill, perfect for outdoor adventures and playtime.",
    shortDescription: "Durable cotton cargo shorts for active kids.",
    sizes: ["S", "M", "L"],
    colors: [COLORS.Olive, COLORS.Navy, COLORS.Beige],
    isFeatured: false,
  },
  {
    name: "Manyavar Boys Kurta Pajama Set",
    brand: "Manyavar",
    price: 1999,
    compareAtPrice: 2799,
    categorySlug: "kids",
    subcategorySlug: "boys",
    material: "Silk Blend",
    careInstructions: "Dry clean only.",
    description:
      "Dress your little one in style with this Manyavar kurta pajama set. Features delicate embroidery on the neckline and a matching churidar pajama. Made from soft silk blend fabric that is gentle on young skin.",
    shortDescription: "Embroidered kurta pajama set for festive occasions.",
    sizes: ["S", "M", "L", "XL"],
    colors: [COLORS.Cream, COLORS.Gold, COLORS.Maroon],
    isFeatured: false,
  },
  // ─── KIDS > GIRLS ────────────────────────────────
  {
    name: "Global Desi Girls Printed Frock",
    brand: "Global Desi",
    price: 899,
    compareAtPrice: 1299,
    categorySlug: "kids",
    subcategorySlug: "girls",
    material: "Cotton",
    careInstructions: "Machine wash cold. Gentle cycle.",
    description:
      "A playful printed frock from Global Desi for girls. Features a colorful all-over print, puff sleeves, and a flared skirt. Made from soft cotton for all-day comfort. Perfect for birthdays, outings, and everyday wear.",
    shortDescription: "Playful printed cotton frock for girls.",
    sizes: ["S", "M", "L"],
    colors: [COLORS.Pink, COLORS.Yellow, COLORS.Coral],
    isFeatured: false,
  },
  {
    name: "Biba Girls Lehenga Choli Set",
    brand: "Biba",
    price: 2499,
    compareAtPrice: 3499,
    categorySlug: "kids",
    subcategorySlug: "girls",
    material: "Art Silk",
    careInstructions: "Dry clean only.",
    description:
      "A miniature version of ethnic elegance. This Biba girls lehenga choli set features mirror work and thread embroidery, with a matching dupatta. Perfect for weddings, Diwali, and festive celebrations.",
    shortDescription: "Embroidered lehenga choli set for festive celebrations.",
    sizes: ["S", "M", "L", "XL"],
    colors: [COLORS.Pink, COLORS.Maroon, COLORS.Teal],
    isFeatured: false,
  },
  // ─── ACCESSORIES > WATCHES ───────────────────────
  {
    name: "Titan Classique Analog Watch",
    brand: "Titan",
    price: 4999,
    compareAtPrice: 5999,
    categorySlug: "accessories",
    subcategorySlug: "watches",
    material: "Stainless Steel Case, Leather Strap",
    careInstructions: "Avoid water exposure. Wipe with soft cloth.",
    description:
      "A timeless analog watch from Titan's Classique collection. Features a clean white dial with Roman numerals, a stainless steel case, and a genuine leather strap. Water resistant up to 30 meters. A perfect blend of elegance and functionality.",
    shortDescription: "Timeless analog watch with leather strap.",
    sizes: ["M"],
    colors: [COLORS.Brown, COLORS.Black],
    isFeatured: false,
  },
  {
    name: "Fastrack Casual Analog Watch",
    brand: "Fastrack",
    price: 1999,
    compareAtPrice: null,
    categorySlug: "accessories",
    subcategorySlug: "watches",
    material: "Stainless Steel, Silicone Strap",
    careInstructions: "Avoid extreme heat. Clean with damp cloth.",
    description:
      "A trendy casual watch from Fastrack with a bold dial and comfortable silicone strap. Perfect for everyday wear with its durable build, splash resistance, and youthful design.",
    shortDescription: "Trendy casual watch with bold design.",
    sizes: ["M"],
    colors: [COLORS.Black, COLORS.Navy, COLORS.Red],
    isFeatured: false,
  },
  // ─── ACCESSORIES > BAGS ──────────────────────────
  {
    name: "Baggit Structured Tote Bag",
    brand: "Baggit",
    price: 2499,
    compareAtPrice: 3299,
    categorySlug: "accessories",
    subcategorySlug: "bags",
    material: "Faux Leather",
    careInstructions: "Wipe clean with damp cloth. Avoid direct sunlight.",
    description:
      "A sleek structured tote bag from Baggit, perfect for work and everyday use. Features multiple compartments, a zip closure, and an inner laptop sleeve. Made from premium faux leather with a luxe finish.",
    shortDescription: "Structured faux leather tote for work and everyday use.",
    sizes: ["M"],
    colors: [COLORS.Black, COLORS.Tan, COLORS.Maroon],
    isFeatured: false,
  },
  {
    name: "Lavie Sling Bag",
    brand: "Lavie",
    price: 1299,
    compareAtPrice: null,
    categorySlug: "accessories",
    subcategorySlug: "bags",
    material: "PU Leather",
    careInstructions: "Wipe with dry cloth. Avoid water.",
    description:
      "A compact and stylish sling bag from Lavie. Features an adjustable strap, magnetic snap closure, and organized interior compartments. Perfect for carrying your essentials while running errands or going out.",
    shortDescription: "Compact and stylish sling bag for everyday essentials.",
    sizes: ["M"],
    colors: [COLORS.Pink, COLORS.Black, COLORS.Cream],
    isFeatured: false,
  },
  // ─── ACCESSORIES > BELTS ─────────────────────────
  {
    name: "Park Avenue Genuine Leather Belt",
    brand: "Park Avenue",
    price: 999,
    compareAtPrice: 1499,
    categorySlug: "accessories",
    subcategorySlug: "belts",
    material: "Genuine Leather",
    careInstructions: "Store in dust bag. Avoid moisture.",
    description:
      "A classic genuine leather belt from Park Avenue with a polished metal buckle. The 35mm width is versatile enough for formal and casual wear. Features a smooth finish and precise stitching along the edges.",
    shortDescription: "Classic genuine leather belt with polished metal buckle.",
    sizes: ["M", "L", "XL"],
    colors: [COLORS.Black, COLORS.Brown],
    isFeatured: false,
  },
  // ─── ACCESSORIES > SUNGLASSES ────────────────────
  {
    name: "Ray-Ban Aviator Sunglasses",
    brand: "Ray-Ban",
    price: 7999,
    compareAtPrice: 9999,
    categorySlug: "accessories",
    subcategorySlug: "sunglasses",
    material: "Metal Frame, Glass Lenses",
    careInstructions: "Clean with microfiber cloth. Store in case.",
    description:
      "The iconic Ray-Ban Aviator with classic teardrop lenses and metal frame. Features 100% UV protection glass lenses and adjustable nose pads for a comfortable fit. A timeless accessory that complements any outfit.",
    shortDescription: "Iconic aviator sunglasses with 100% UV protection.",
    sizes: ["M"],
    colors: [COLORS.Gold, COLORS.Silver, COLORS.Black],
    isFeatured: false,
  },
  // ─── EXTRA PRODUCTS TO REACH 40+ ─────────────────
  {
    name: "Peter England Polo T-Shirt",
    brand: "Peter England",
    price: 899,
    compareAtPrice: null,
    categorySlug: "men",
    subcategorySlug: "t-shirts",
    material: "Cotton Pique",
    careInstructions: "Machine wash cold.",
    description:
      "A crisp polo t-shirt from Peter England in premium cotton pique. Features the brand's embroidered logo, ribbed collar and cuffs, and a two-button placket. A smart-casual staple.",
    shortDescription: "Crisp cotton polo tee, a smart-casual staple.",
    sizes: ["S", "M", "L", "XL"],
    colors: [COLORS.Navy, COLORS.White, COLORS.Red],
    isFeatured: false,
  },
  {
    name: "Raymond Formal Trousers",
    brand: "Raymond",
    price: 2299,
    compareAtPrice: 2999,
    categorySlug: "men",
    subcategorySlug: "trousers",
    material: "Wool Blend",
    careInstructions: "Dry clean only.",
    description:
      "Premium formal trousers from Raymond crafted in a fine wool blend. Features a flat front, medium rise, and a slim fit silhouette. The wrinkle-resistant fabric ensures a sharp look from morning meetings to evening events.",
    shortDescription: "Premium wool blend formal trousers with slim fit.",
    sizes: ["M", "L", "XL", "XXL"],
    colors: [COLORS.Charcoal, COLORS.Navy, COLORS.Black],
    isFeatured: false,
  },
  {
    name: "Aurelia Printed A-Line Kurti",
    brand: "Aurelia",
    price: 999,
    compareAtPrice: 1399,
    categorySlug: "women",
    subcategorySlug: "kurtis",
    material: "Cotton",
    careInstructions: "Machine wash cold. Iron on medium heat.",
    description:
      "A cheerful printed A-line kurti from Aurelia in soft cotton. Features mandarin collar, three-quarter sleeves, and a relaxed fit that works for office, college, or casual outings. Pair with palazzos or churidars.",
    shortDescription: "Cheerful printed A-line kurti for versatile styling.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [COLORS.Yellow, COLORS.Blue, COLORS.Green],
    isFeatured: false,
  },
  {
    name: "Libas Embroidered Kurti Pant Set",
    brand: "Libas",
    price: 2199,
    compareAtPrice: 2999,
    categorySlug: "women",
    subcategorySlug: "kurtis",
    material: "Rayon",
    careInstructions: "Hand wash separately. Dry in shade.",
    description:
      "An elegant embroidered kurti and pant set from Libas. Features delicate thread embroidery on the yoke, straight-cut kurta, and matching ankle-length pants. Perfect for office ethnic days and festive wear.",
    shortDescription: "Embroidered kurti pant set for elegant ethnic wear.",
    sizes: ["S", "M", "L", "XL"],
    colors: [COLORS.Teal, COLORS.Wine, COLORS.Mustard],
    isFeatured: false,
  },
  {
    name: "Van Heusen Woman Formal Blazer",
    brand: "Van Heusen",
    price: 3499,
    compareAtPrice: 4499,
    categorySlug: "women",
    subcategorySlug: "tops",
    material: "Polyester Blend",
    careInstructions: "Dry clean only.",
    description:
      "A tailored single-breasted blazer from Van Heusen Woman. Features notched lapels, padded shoulders, and functional pockets. The structured fit and premium fabric make it a power dressing essential.",
    shortDescription: "Tailored single-breasted blazer for power dressing.",
    sizes: ["S", "M", "L", "XL"],
    colors: [COLORS.Black, COLORS.Navy, COLORS.Grey],
    isFeatured: false,
  },
  {
    name: "FabIndia Block Print Cotton Top",
    brand: "FabIndia",
    price: 1199,
    compareAtPrice: null,
    categorySlug: "women",
    subcategorySlug: "tops",
    material: "Block Printed Cotton",
    careInstructions: "Hand wash separately. Dry in shade.",
    description:
      "A hand block-printed cotton top from FabIndia, crafted by artisans in Jaipur. The natural dyes and traditional prints give each piece a unique character. Features a boat neck and three-quarter sleeves.",
    shortDescription: "Hand block-printed cotton top with artisan charm.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [COLORS.Indigo, COLORS.Rust, COLORS.Sage],
    isFeatured: false,
  },
];

// ───────────────────────────────────────────────────
// Review comments pool
// ───────────────────────────────────────────────────

const reviewComments = [
  { title: "Great quality!", comment: "Very comfortable fabric, fits perfectly! Great value for money.", rating: 5 },
  { title: "Good product", comment: "Color is slightly different from the image but overall quality is good.", rating: 4 },
  { title: "Loved it!", comment: "Excellent quality, my husband loved this kurta. Will order more.", rating: 5 },
  { title: "Accurate sizing", comment: "Size chart is accurate. Delivered on time.", rating: 5 },
  { title: "Worth the price", comment: "Material feels premium. Worth every rupee.", rating: 5 },
  { title: "Nice fabric", comment: "Fabric quality is really nice. Slightly loose fit but looks great.", rating: 4 },
  { title: "Fast delivery", comment: "Received in 3 days. Product is exactly as described. Happy customer!", rating: 5 },
  { title: "Could be better", comment: "Stitching could be better at the seams. Otherwise a decent product.", rating: 3 },
  { title: "Perfect for office", comment: "Wearing this to office every other day. Very comfortable and looks professional.", rating: 5 },
  { title: "Nice color", comment: "The color is even more vibrant in person. Love the shade!", rating: 4 },
  { title: "Good for gifting", comment: "Bought this as a gift for my brother. He absolutely loved it.", rating: 5 },
  { title: "Runs small", comment: "Ordered my usual size but it runs a bit small. Consider ordering one size up.", rating: 3 },
  { title: "Elegant piece", comment: "Such an elegant piece. Got many compliments at the family gathering.", rating: 5 },
  { title: "Average quality", comment: "Expected better quality for this price. Material is thinner than expected.", rating: 3 },
  { title: "Beautiful design", comment: "The design is beautiful and unique. Exactly what I was looking for.", rating: 5 },
  { title: "Comfortable wear", comment: "Very comfortable for daily wear. Soft on the skin and breathable.", rating: 4 },
  { title: "Not impressed", comment: "Product looks different from the picture. The color faded after first wash.", rating: 2 },
  { title: "Superb!", comment: "Superb quality! One of the best purchases I have made online.", rating: 5 },
  { title: "Decent product", comment: "Decent product for the price. Nothing extraordinary but does the job.", rating: 3 },
  { title: "Perfect fit", comment: "Perfect fit and finish. The attention to detail is impressive.", rating: 5 },
  { title: "Good value", comment: "Good value for money. Would recommend to friends and family.", rating: 4 },
  { title: "Disappointed", comment: "Received a defective piece with loose threads. Had to return it.", rating: 1 },
  { title: "Festival ready", comment: "Wore this for Diwali. Received so many compliments! Will buy more.", rating: 5 },
  { title: "Stylish", comment: "Very stylish and trendy. Goes well with different outfits.", rating: 4 },
  { title: "Mixed feelings", comment: "Design is nice but the fabric quality could be improved. Okay for the price.", rating: 3 },
  { title: "Must buy!", comment: "Must buy product! Premium quality at an affordable price. No complaints at all.", rating: 5 },
  { title: "Lovely purchase", comment: "Very happy with this purchase. Soft material and beautiful embroidery.", rating: 5 },
  { title: "Good packaging", comment: "Came in nice packaging. Product is good quality. Will shop again.", rating: 4 },
  { title: "Not worth it", comment: "Overpriced for what you get. The material feels cheap compared to the pictures.", rating: 2 },
  { title: "Daily wear essential", comment: "This has become my go-to daily wear. Comfortable and easy to maintain.", rating: 4 },
];

// ───────────────────────────────────────────────────
// Main Seed Function
// ───────────────────────────────────────────────────

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(config.MONGODB_URI);
  console.log("Connected to MongoDB.\n");

  // ─── Clear all collections ────────────────────
  console.log("Clearing all collections...");
  await Promise.all([
    User.deleteMany({}),
    Address.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    ProductVariant.deleteMany({}),
    Review.deleteMany({}),
    Coupon.deleteMany({}),
    Order.deleteMany({}),
    OrderItem.deleteMany({}),
    CartItem.deleteMany({}),
    Wishlist.deleteMany({}),
    Newsletter.deleteMany({}),
  ]);
  console.log("All collections cleared.\n");

  // ─── Users ────────────────────────────────────
  console.log("Seeding users...");
  const adminPwd = await hashPassword("Admin@123");
  const custPwd = await hashPassword("Test@123");

  const admin = await User.create({
    email: "admin@clothstore.com",
    password: adminPwd,
    firstName: "Priya",
    lastName: "Sharma",
    role: "ADMIN",
    emailVerified: true,
    phone: "+91 9000000000",
  });

  const rahul = await User.create({
    email: "rahul.kumar@gmail.com",
    password: custPwd,
    firstName: "Rahul",
    lastName: "Kumar",
    role: "CUSTOMER",
    emailVerified: true,
    phone: "+91 9876543210",
  });

  const anita = await User.create({
    email: "anita.patel@gmail.com",
    password: custPwd,
    firstName: "Anita",
    lastName: "Patel",
    role: "CUSTOMER",
    emailVerified: true,
    phone: "+91 9876543211",
  });

  const vikram = await User.create({
    email: "vikram.singh@gmail.com",
    password: custPwd,
    firstName: "Vikram",
    lastName: "Singh",
    role: "CUSTOMER",
    emailVerified: true,
    phone: "+91 9876543212",
  });

  const customers = [rahul, anita, vikram];
  console.log(`  Created ${4} users (1 admin, 3 customers).\n`);

  // ─── Addresses ────────────────────────────────
  console.log("Seeding addresses...");
  const addressData = [
    {
      userId: rahul._id,
      addresses: [
        { fullName: "Rahul Kumar", phone: "+91 9876543210", addressLine1: "42, Lotus Apartments", addressLine2: "Andheri West", city: "Mumbai", state: "Maharashtra", pincode: "400058", type: "HOME" as const, isDefault: true },
        { fullName: "Rahul Kumar", phone: "+91 9876543210", addressLine1: "Tower B, 15th Floor, Maker Maxity", addressLine2: "BKC, Bandra East", city: "Mumbai", state: "Maharashtra", pincode: "400051", type: "WORK" as const, isDefault: false },
      ],
    },
    {
      userId: anita._id,
      addresses: [
        { fullName: "Anita Patel", phone: "+91 9876543211", addressLine1: "D-12, Saket Residency", addressLine2: "Saket", city: "New Delhi", state: "Delhi", pincode: "110017", type: "HOME" as const, isDefault: true },
        { fullName: "Anita Patel", phone: "+91 9876543211", addressLine1: "A-62, Tech Park", addressLine2: "Sector 62", city: "Noida", state: "Uttar Pradesh", pincode: "201309", type: "WORK" as const, isDefault: false },
      ],
    },
    {
      userId: vikram._id,
      addresses: [
        { fullName: "Vikram Singh", phone: "+91 9876543212", addressLine1: "78, 5th Cross, 6th Block", addressLine2: "Koramangala", city: "Bangalore", state: "Karnataka", pincode: "560034", type: "HOME" as const, isDefault: true },
        { fullName: "Vikram Singh", phone: "+91 9876543212", addressLine1: "WeWork Galaxy, Residency Road", addressLine2: "Whitefield", city: "Bangalore", state: "Karnataka", pincode: "560066", type: "WORK" as const, isDefault: false },
      ],
    },
  ];

  const allAddresses: any[] = [];
  for (const group of addressData) {
    for (const addr of group.addresses) {
      const created = await Address.create({ userId: group.userId, ...addr });
      allAddresses.push(created);
    }
  }
  console.log(`  Created ${allAddresses.length} addresses.\n`);

  // ─── Categories ───────────────────────────────
  console.log("Seeding categories...");
  const parentCategories = [
    { name: "Men", slug: "men", description: "Men's clothing and fashion" },
    { name: "Women", slug: "women", description: "Women's clothing and fashion" },
    { name: "Kids", slug: "kids", description: "Kids' clothing and fashion" },
    { name: "Accessories", slug: "accessories", description: "Fashion accessories" },
  ];

  const subcategoryMap: Record<string, { name: string; slug: string }[]> = {
    men: [
      { name: "T-Shirts", slug: "t-shirts" },
      { name: "Shirts", slug: "shirts" },
      { name: "Jeans", slug: "jeans" },
      { name: "Trousers", slug: "trousers" },
      { name: "Kurtas", slug: "kurtas" },
      { name: "Jackets", slug: "jackets" },
    ],
    women: [
      { name: "Dresses", slug: "dresses" },
      { name: "Tops", slug: "tops" },
      { name: "Sarees", slug: "sarees" },
      { name: "Lehengas", slug: "lehengas" },
      { name: "Jeans", slug: "jeans-women" },
      { name: "Kurtis", slug: "kurtis" },
    ],
    kids: [
      { name: "Boys", slug: "boys" },
      { name: "Girls", slug: "girls" },
    ],
    accessories: [
      { name: "Watches", slug: "watches" },
      { name: "Bags", slug: "bags" },
      { name: "Belts", slug: "belts" },
      { name: "Sunglasses", slug: "sunglasses" },
    ],
  };

  const categoryIdMap: Record<string, mongoose.Types.ObjectId> = {};

  for (const cat of parentCategories) {
    const created = await Category.create(cat);
    categoryIdMap[cat.slug] = created._id as mongoose.Types.ObjectId;

    const subs = subcategoryMap[cat.slug] || [];
    for (const sub of subs) {
      const subCreated = await Category.create({
        name: sub.name,
        slug: sub.slug,
        description: `${sub.name} in ${cat.name}`,
        parentId: created._id,
      });
      categoryIdMap[sub.slug] = subCreated._id as mongoose.Types.ObjectId;
    }
  }
  console.log(`  Created ${Object.keys(categoryIdMap).length} categories.\n`);

  // ─── Products & Variants ──────────────────────
  console.log("Seeding products and variants...");
  const allProducts: any[] = [];
  const allVariants: any[] = [];

  for (const def of productDefs) {
    const pSlug = slugify(def.name);
    const catId = categoryIdMap[def.subcategorySlug] || categoryIdMap[def.categorySlug];

    const product = await Product.create({
      name: def.name,
      slug: pSlug,
      description: def.description,
      shortDescription: def.shortDescription,
      price: def.price * 100, // Store in paise
      compareAtPrice: def.compareAtPrice ? def.compareAtPrice * 100 : null,
      categoryId: catId,
      brand: def.brand,
      material: def.material,
      careInstructions: def.careInstructions,
      isActive: true,
      isFeatured: def.isFeatured,
    });

    // Create variants
    const brandCode = def.brand
      .replace(/[^A-Za-z]/g, "")
      .substring(0, 5)
      .toUpperCase();

    for (const color of def.colors) {
      for (const size of def.sizes) {
        const colorCode = color.name
          .replace(/[^A-Za-z]/g, "")
          .substring(0, 3)
          .toUpperCase();
        const sku = `${brandCode}-${pSlug.substring(0, 6).toUpperCase()}-${colorCode}-${size}`;

        const variant = await ProductVariant.create({
          productId: product._id,
          size: size as any,
          color: color.name,
          colorHex: color.hex,
          sku,
          stock: rand(5, 100),
          images: [makeImage(def.name)],
        });
        allVariants.push(variant);
      }
    }

    allProducts.push(product);
  }

  console.log(`  Created ${allProducts.length} products with ${allVariants.length} variants.\n`);

  // ─── Reviews ──────────────────────────────────
  console.log("Seeding reviews...");
  let reviewCount = 0;
  const reviewsPerProduct: Record<string, { sum: number; count: number }> = {};

  // Distribute reviews across products — ensure at least 1 review per product, aim for 50+ total
  for (const product of allProducts) {
    const numReviews = rand(1, 3);
    const usedCustomers = new Set<string>();

    for (let i = 0; i < numReviews && i < customers.length; i++) {
      const customer = customers[i];
      if (usedCustomers.has(customer._id.toString())) continue;
      usedCustomers.add(customer._id.toString());

      const reviewData = pick(reviewComments);

      await Review.create({
        userId: customer._id,
        productId: product._id,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        isVerified: Math.random() > 0.3,
      });

      if (!reviewsPerProduct[product._id.toString()]) {
        reviewsPerProduct[product._id.toString()] = { sum: 0, count: 0 };
      }
      reviewsPerProduct[product._id.toString()].sum += reviewData.rating;
      reviewsPerProduct[product._id.toString()].count += 1;
      reviewCount++;
    }
  }

  // Add extra reviews to hit 50+ total
  while (reviewCount < 55) {
    const product = pick(allProducts);
    const customer = pick(customers);
    const pid = product._id.toString();
    const cid = customer._id.toString();

    // Check unique constraint
    const existing = await Review.findOne({ userId: cid, productId: pid });
    if (existing) continue;

    const reviewData = pick(reviewComments);
    await Review.create({
      userId: customer._id,
      productId: product._id,
      rating: reviewData.rating,
      title: reviewData.title,
      comment: reviewData.comment,
      isVerified: Math.random() > 0.4,
    });

    if (!reviewsPerProduct[pid]) {
      reviewsPerProduct[pid] = { sum: 0, count: 0 };
    }
    reviewsPerProduct[pid].sum += reviewData.rating;
    reviewsPerProduct[pid].count += 1;
    reviewCount++;
  }

  // Update product avgRating and reviewCount
  for (const [pid, data] of Object.entries(reviewsPerProduct)) {
    const avg = Math.round((data.sum / data.count) * 10) / 10;
    await Product.findByIdAndUpdate(pid, {
      avgRating: avg,
      reviewCount: data.count,
    });
  }

  console.log(`  Created ${reviewCount} reviews and updated product ratings.\n`);

  // ─── Coupons ──────────────────────────────────
  console.log("Seeding coupons...");
  await Coupon.create([
    {
      code: "WELCOME10",
      description: "10% off on your first order",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minimumAmount: 999 * 100,
      maximumDiscount: 500 * 100,
      usageLimit: 1000,
      usedCount: 42,
      validFrom: new Date("2024-01-01"),
      validUntil: new Date("2025-12-31"),
      isActive: true,
    },
    {
      code: "FLAT500",
      description: "Flat Rs.500 off on orders above Rs.2999",
      discountType: "FIXED",
      discountValue: 500 * 100,
      minimumAmount: 2999 * 100,
      maximumDiscount: null,
      usageLimit: 500,
      usedCount: 18,
      validFrom: new Date("2024-01-01"),
      validUntil: new Date("2025-12-31"),
      isActive: true,
    },
    {
      code: "SUMMER20",
      description: "20% off on summer collection",
      discountType: "PERCENTAGE",
      discountValue: 20,
      minimumAmount: 1499 * 100,
      maximumDiscount: 1000 * 100,
      usageLimit: 300,
      usedCount: 65,
      validFrom: new Date("2024-01-01"),
      validUntil: new Date("2025-12-31"),
      isActive: true,
    },
  ]);
  console.log("  Created 3 coupons.\n");

  // ─── Orders ───────────────────────────────────
  console.log("Seeding orders...");

  interface OrderSpec {
    customer: typeof rahul;
    addressIndex: number;
    status: string;
    paymentStatus: string;
    itemCount: number;
    daysAgoCreated: number;
    couponCode?: string;
  }

  const orderSpecs: OrderSpec[] = [
    // DELIVERED
    { customer: rahul, addressIndex: 0, status: "DELIVERED", paymentStatus: "PAID", itemCount: 3, daysAgoCreated: 45 },
    { customer: rahul, addressIndex: 0, status: "DELIVERED", paymentStatus: "PAID", itemCount: 2, daysAgoCreated: 30, couponCode: "WELCOME10" },
    { customer: anita, addressIndex: 2, status: "DELIVERED", paymentStatus: "PAID", itemCount: 4, daysAgoCreated: 25 },
    { customer: vikram, addressIndex: 4, status: "DELIVERED", paymentStatus: "PAID", itemCount: 2, daysAgoCreated: 20 },
    // SHIPPED
    { customer: anita, addressIndex: 2, status: "SHIPPED", paymentStatus: "PAID", itemCount: 2, daysAgoCreated: 5 },
    { customer: vikram, addressIndex: 4, status: "SHIPPED", paymentStatus: "PAID", itemCount: 3, daysAgoCreated: 4 },
    { customer: rahul, addressIndex: 1, status: "SHIPPED", paymentStatus: "PAID", itemCount: 1, daysAgoCreated: 3 },
    // PROCESSING
    { customer: anita, addressIndex: 3, status: "PROCESSING", paymentStatus: "PAID", itemCount: 2, daysAgoCreated: 2 },
    { customer: vikram, addressIndex: 5, status: "PROCESSING", paymentStatus: "PAID", itemCount: 1, daysAgoCreated: 1 },
    // CONFIRMED
    { customer: rahul, addressIndex: 0, status: "CONFIRMED", paymentStatus: "PAID", itemCount: 2, daysAgoCreated: 1, couponCode: "FLAT500" },
    { customer: anita, addressIndex: 2, status: "CONFIRMED", paymentStatus: "PAID", itemCount: 3, daysAgoCreated: 0 },
    // PENDING
    { customer: vikram, addressIndex: 4, status: "PENDING", paymentStatus: "PENDING", itemCount: 2, daysAgoCreated: 0 },
    // CANCELLED
    { customer: rahul, addressIndex: 0, status: "CANCELLED", paymentStatus: "PAID", itemCount: 1, daysAgoCreated: 15 },
  ];

  let orderIndex = 0;
  const usedVariantSets = new Set<string>();

  for (const spec of orderSpecs) {
    const createdAt = daysAgo(spec.daysAgoCreated);
    const addr = allAddresses[spec.addressIndex];

    const orderAddress = {
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: "India",
    };

    // Pick random variants for items
    const orderItems: any[] = [];
    const pickedVariantIds = new Set<string>();

    for (let i = 0; i < spec.itemCount; i++) {
      let variant: any = null;
      let product: any = null;
      let attempts = 0;

      while (attempts < 50) {
        const randomProduct = pick(allProducts);
        const productVariants = allVariants.filter(
          (v: any) => v.productId.toString() === randomProduct._id.toString()
        );
        if (productVariants.length === 0) {
          attempts++;
          continue;
        }
        const randomVariant = pick(productVariants);
        if (!pickedVariantIds.has(randomVariant._id.toString())) {
          variant = randomVariant;
          product = randomProduct;
          pickedVariantIds.add(variant._id.toString());
          break;
        }
        attempts++;
      }

      if (!variant || !product) continue;

      const qty = rand(1, 3);
      orderItems.push({
        variant,
        product,
        quantity: qty,
        price: product.price, // paise
      });
    }

    if (orderItems.length === 0) continue;

    const subtotal = orderItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );
    const shippingCharge = subtotal >= 999 * 100 ? 0 : 79 * 100;

    let discount = 0;
    if (spec.couponCode === "WELCOME10") {
      discount = Math.min(Math.round(subtotal * 0.1), 500 * 100);
    } else if (spec.couponCode === "FLAT500") {
      discount = 500 * 100;
    }

    const total = subtotal + shippingCharge - discount;

    // Build status history
    const statusHistory: { status: string; timestamp: Date; note: string }[] = [];
    const statusFlow = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
    const targetIdx = statusFlow.indexOf(spec.status);

    if (spec.status === "CANCELLED") {
      statusHistory.push({ status: "PENDING", timestamp: createdAt, note: "Order placed" });
      statusHistory.push({ status: "CONFIRMED", timestamp: new Date(createdAt.getTime() + 3600000), note: "Payment confirmed" });
      statusHistory.push({ status: "CANCELLED", timestamp: new Date(createdAt.getTime() + 86400000 * 2), note: "Cancelled by customer" });
    } else {
      for (let si = 0; si <= Math.min(targetIdx, statusFlow.length - 1); si++) {
        const ts = new Date(createdAt.getTime() + si * 86400000);
        const notes = [
          "Order placed",
          "Payment confirmed",
          "Order is being processed",
          "Shipped via Delhivery",
          "Delivered successfully",
        ];
        statusHistory.push({
          status: statusFlow[si],
          timestamp: ts,
          note: notes[si],
        });
      }
    }

    const orderNumber = generateOrderNumber(orderIndex);

    const order = await Order.create({
      orderNumber,
      userId: spec.customer._id,
      status: spec.status,
      paymentStatus: spec.paymentStatus,
      paymentMethod: "razorpay",
      subtotal,
      tax: 0,
      shippingCharge,
      discount,
      total,
      shippingAddress: orderAddress,
      billingAddress: orderAddress,
      couponCode: spec.couponCode || "",
      notes: "",
      statusHistory,
      createdAt,
      updatedAt: createdAt,
    });

    // Create order items
    for (const item of orderItems) {
      await OrderItem.create({
        orderId: order._id,
        variantId: item.variant._id,
        productName: item.product.name,
        productSlug: item.product.slug,
        size: item.variant.size,
        color: item.variant.color,
        price: item.price,
        quantity: item.quantity,
        image: item.variant.images[0] || "",
      });
    }

    orderIndex++;
  }

  console.log(`  Created ${orderIndex} orders with items.\n`);

  // ─── Done ─────────────────────────────────────
  console.log("=".repeat(50));
  console.log("Seed completed successfully!");
  console.log("=".repeat(50));
  console.log(`  Users:      4`);
  console.log(`  Addresses:  ${allAddresses.length}`);
  console.log(`  Categories: ${Object.keys(categoryIdMap).length}`);
  console.log(`  Products:   ${allProducts.length}`);
  console.log(`  Variants:   ${allVariants.length}`);
  console.log(`  Reviews:    ${reviewCount}`);
  console.log(`  Coupons:    3`);
  console.log(`  Orders:     ${orderIndex}`);
  console.log();

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
