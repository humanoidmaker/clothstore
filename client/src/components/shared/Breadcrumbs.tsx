import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-sm text-gray-500", className)}
    >
      <ol className="flex flex-wrap items-center gap-1">
        <li className="flex items-center">
          <Link
            to="/"
            className="flex items-center transition-colors hover:text-primary"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
              {isLast || !item.href ? (
                <span
                  className={cn(
                    "truncate",
                    isLast
                      ? "font-medium text-primary"
                      : "text-gray-500"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="truncate transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
