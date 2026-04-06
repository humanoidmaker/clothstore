import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

function SkeletonBase({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
    />
  );
}

export function SkeletonText({ className }: SkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <SkeletonBase className="h-4 w-full" />
      <SkeletonBase className="h-4 w-4/5" />
      <SkeletonBase className="h-4 w-3/5" />
    </div>
  );
}

export function SkeletonAvatar({ className }: SkeletonProps) {
  return (
    <SkeletonBase
      className={cn("h-10 w-10 shrink-0 rounded-full", className)}
    />
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-100 bg-white p-4 shadow-sm",
        className
      )}
    >
      <SkeletonBase className="mb-4 aspect-square w-full rounded-lg" />
      <div className="space-y-2">
        <SkeletonBase className="h-4 w-3/4" />
        <SkeletonBase className="h-4 w-1/2" />
        <SkeletonBase className="h-5 w-1/3" />
      </div>
    </div>
  );
}

export function SkeletonProductCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "group rounded-xl border border-gray-100 bg-white shadow-sm",
        className
      )}
    >
      <div className="relative overflow-hidden rounded-t-xl">
        <SkeletonBase className="aspect-[3/4] w-full" />
      </div>
      <div className="space-y-2 p-4">
        <SkeletonBase className="h-3 w-1/3" />
        <SkeletonBase className="h-4 w-4/5" />
        <div className="flex items-center gap-1">
          <SkeletonBase className="h-3 w-20" />
          <SkeletonBase className="h-3 w-8" />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <SkeletonBase className="h-5 w-16" />
          <SkeletonBase className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

export { SkeletonBase as Skeleton };
