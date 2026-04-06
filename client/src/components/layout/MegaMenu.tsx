import { Link } from "react-router-dom";

export interface MegaMenuCategory {
  label: string;
  slug: string;
  subcategories: { label: string; slug: string }[];
  featured?: {
    image: string;
    title: string;
    link: string;
  };
}

interface MegaMenuProps {
  category: MegaMenuCategory;
  isOpen: boolean;
}

export const NAV_CATEGORIES: MegaMenuCategory[] = [
  {
    label: "Men",
    slug: "men",
    subcategories: [
      { label: "T-Shirts", slug: "men-tshirts" },
      { label: "Shirts", slug: "men-shirts" },
      { label: "Jeans", slug: "men-jeans" },
      { label: "Trousers", slug: "men-trousers" },
      { label: "Jackets", slug: "men-jackets" },
      { label: "Kurtas", slug: "men-kurtas" },
      { label: "Activewear", slug: "men-activewear" },
      { label: "Innerwear", slug: "men-innerwear" },
    ],
    featured: {
      image: "/images/featured-men.jpg",
      title: "New Arrivals",
      link: "/category/men?sort=newest",
    },
  },
  {
    label: "Women",
    slug: "women",
    subcategories: [
      { label: "Dresses", slug: "women-dresses" },
      { label: "Tops", slug: "women-tops" },
      { label: "Sarees", slug: "women-sarees" },
      { label: "Kurtis", slug: "women-kurtis" },
      { label: "Jeans", slug: "women-jeans" },
      { label: "Skirts", slug: "women-skirts" },
      { label: "Activewear", slug: "women-activewear" },
      { label: "Lingerie", slug: "women-lingerie" },
    ],
    featured: {
      image: "/images/featured-women.jpg",
      title: "Trending Now",
      link: "/category/women?sort=popular",
    },
  },
  {
    label: "Kids",
    slug: "kids",
    subcategories: [
      { label: "Boys T-Shirts", slug: "kids-boys-tshirts" },
      { label: "Girls Dresses", slug: "kids-girls-dresses" },
      { label: "Boys Jeans", slug: "kids-boys-jeans" },
      { label: "Girls Tops", slug: "kids-girls-tops" },
      { label: "School Uniforms", slug: "kids-uniforms" },
      { label: "Sleepwear", slug: "kids-sleepwear" },
    ],
    featured: {
      image: "/images/featured-kids.jpg",
      title: "Back to School",
      link: "/category/kids",
    },
  },
  {
    label: "Accessories",
    slug: "accessories",
    subcategories: [
      { label: "Bags", slug: "accessories-bags" },
      { label: "Belts", slug: "accessories-belts" },
      { label: "Watches", slug: "accessories-watches" },
      { label: "Sunglasses", slug: "accessories-sunglasses" },
      { label: "Jewellery", slug: "accessories-jewellery" },
      { label: "Scarves", slug: "accessories-scarves" },
    ],
    featured: {
      image: "/images/featured-accessories.jpg",
      title: "Must-Have Picks",
      link: "/category/accessories",
    },
  },
];

export default function MegaMenu({ category, isOpen }: MegaMenuProps) {
  const midpoint = Math.ceil(category.subcategories.length / 2);
  const col1 = category.subcategories.slice(0, midpoint);
  const col2 = category.subcategories.slice(midpoint);

  return (
    <div
      className={`absolute left-0 top-full w-full bg-white shadow-xl border-t border-gray-100 z-50 transition-all duration-200 ${
        isOpen
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-4 gap-8">
          {/* Column 1 */}
          <div>
            <h3 className="text-sm font-semibold text-[#1a1f36] uppercase tracking-wider mb-4">
              {category.label}
            </h3>
            <ul className="space-y-2.5">
              {col1.map((sub) => (
                <li key={sub.slug}>
                  <Link
                    to={`/category/${sub.slug}`}
                    className="text-sm text-[#2d3436]/70 hover:text-[#c8a96e] transition-colors"
                  >
                    {sub.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="text-sm font-semibold text-[#1a1f36] uppercase tracking-wider mb-4">
              &nbsp;
            </h3>
            <ul className="space-y-2.5">
              {col2.map((sub) => (
                <li key={sub.slug}>
                  <Link
                    to={`/category/${sub.slug}`}
                    className="text-sm text-[#2d3436]/70 hover:text-[#c8a96e] transition-colors"
                  >
                    {sub.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* View All */}
          <div>
            <h3 className="text-sm font-semibold text-[#1a1f36] uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to={`/category/${category.slug}`}
                  className="text-sm text-[#c8a96e] font-medium hover:underline"
                >
                  View All {category.label}
                </Link>
              </li>
              <li>
                <Link
                  to={`/category/${category.slug}?sort=newest`}
                  className="text-sm text-[#2d3436]/70 hover:text-[#c8a96e] transition-colors"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  to={`/category/${category.slug}?sort=popular`}
                  className="text-sm text-[#2d3436]/70 hover:text-[#c8a96e] transition-colors"
                >
                  Best Sellers
                </Link>
              </li>
            </ul>
          </div>

          {/* Featured Image / Promo */}
          {category.featured && (
            <div>
              <Link
                to={category.featured.link}
                className="block group overflow-hidden rounded-lg"
              >
                <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={category.featured.image}
                    alt={category.featured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1f36]/60 to-transparent flex items-end p-4">
                    <span className="text-white font-semibold text-sm">
                      {category.featured.title} &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
