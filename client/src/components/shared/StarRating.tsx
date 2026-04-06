import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  count?: number;
  className?: string;
}

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-4.5 w-4.5",
  lg: "h-5.5 w-5.5",
};

const textSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function StarRating({
  rating,
  size = "md",
  showCount = false,
  count = 0,
  className,
}: StarRatingProps) {
  const clampedRating = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(clampedRating);
  const hasHalfStar = clampedRating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <div className="flex items-center">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(sizeMap[size], "fill-amber-400 text-amber-400")}
          />
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star
              className={cn(sizeMap[size], "text-gray-200")}
            />
            <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
              <Star
                className={cn(
                  sizeMap[size],
                  "fill-amber-400 text-amber-400"
                )}
              />
            </div>
          </div>
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(sizeMap[size], "text-gray-200")}
          />
        ))}
      </div>

      {showCount && (
        <span
          className={cn(
            "ml-1 text-gray-500",
            textSizeMap[size]
          )}
        >
          ({count})
        </span>
      )}
    </div>
  );
}
