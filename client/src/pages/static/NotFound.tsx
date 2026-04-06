import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Home, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const popularCategories = [
  { name: "Men", href: "/category/men" },
  { name: "Women", href: "/category/women" },
  { name: "Kids", href: "/category/kids" },
  { name: "T-Shirts", href: "/category/t-shirts" },
  { name: "Kurtas", href: "/category/kurtas" },
  { name: "Sarees", href: "/category/sarees" },
  { name: "Jeans", href: "/category/jeans" },
  { name: "Accessories", href: "/category/accessories" },
];

export default function NotFound() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16">
      {/* 404 Number */}
      <h1
        className="text-[120px] font-black leading-none md:text-[180px]"
        style={{
          background: "linear-gradient(135deg, #1a1f36 0%, #c8a96e 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        404
      </h1>

      {/* Heading */}
      <h2 className="mt-2 text-2xl font-bold text-[#1a1f36] md:text-3xl">
        Page Not Found
      </h2>
      <p className="mx-auto mt-3 max-w-md text-center text-gray-500">
        The page you are looking for does not exist or has been moved. Try
        searching for what you need or browse our popular categories.
      </p>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="mx-auto mt-8 flex w-full max-w-md gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="accent">
          Search
        </Button>
      </form>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link to="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <Link to="/category/men">
          <Button variant="outline" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            Browse Categories
          </Button>
        </Link>
      </div>

      {/* Popular Categories */}
      <div className="mt-10 text-center">
        <p className="mb-3 text-sm font-medium text-gray-500">
          Popular Categories
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {popularCategories.map((cat) => (
            <Link
              key={cat.name}
              to={cat.href}
              className="rounded-full border border-gray-200 px-4 py-1.5 text-sm text-[#2d3436] transition-colors hover:border-[#c8a96e] hover:bg-[#c8a96e]/5 hover:text-[#1a1f36]"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
