import { cn, formatPrice } from "@/lib/utils";

interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const priceTextSize = {
  sm: "text-sm font-semibold",
  md: "text-lg font-bold",
  lg: "text-2xl font-bold",
};

const compareTextSize = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

const badgeTextSize = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-0.5",
  lg: "text-sm px-2.5 py-1",
};

export function PriceDisplay({
  price,
  compareAtPrice,
  size = "md",
  className,
}: PriceDisplayProps) {
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPercentage = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className={cn("text-primary", priceTextSize[size])}>
        {formatPrice(price)}
      </span>

      {hasDiscount && (
        <>
          <span
            className={cn(
              "text-gray-400 line-through",
              compareTextSize[size]
            )}
          >
            {formatPrice(compareAtPrice)}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full bg-green-50 font-semibold text-green-700",
              badgeTextSize[size]
            )}
          >
            {discountPercentage}% off
          </span>
        </>
      )}
    </div>
  );
}
