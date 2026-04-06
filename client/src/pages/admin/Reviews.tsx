import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { StarRating } from "@/components/shared/StarRating";
import { apiGet, apiDelete } from "@/lib/api";
import { formatDate, cn, truncate } from "@/lib/utils";
import type { Review, Product, PaginatedResponse } from "@/types";

interface ReviewWithProduct extends Review {
  productData?: Pick<Product, "_id" | "name" | "thumbnail" | "slug">;
}

export default function Reviews() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReviewWithProduct | null>(null);
  const limit = 15;

  const { data, isLoading } = useQuery<PaginatedResponse<ReviewWithProduct>>({
    queryKey: ["admin-reviews", page, search, ratingFilter, sortBy],
    queryFn: () =>
      apiGet("/admin/reviews", {
        page,
        limit,
        search: search || undefined,
        rating: ratingFilter !== "all" ? Number(ratingFilter) : undefined,
        sort: sortBy,
      }),
  });

  const reviews = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/reviews/${id}`),
    onSuccess: () => {
      toast.success("Review deleted.");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: () => toast.error("Failed to delete review."),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1a1f36]">Reviews</h1>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search reviews..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={ratingFilter}
              onValueChange={(v) => {
                setRatingFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(v) => {
                setSortBy(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="rating_high">Rating: High</SelectItem>
                <SelectItem value="rating_low">Rating: Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No reviews found"
              description="Reviews from customers will appear here."
            />
          ) : (
            <div className="divide-y">
              {reviews.map((review) => {
                const isExpanded = expandedId === review._id;
                return (
                  <div
                    key={review._id}
                    className="px-4 py-4 hover:bg-gray-50/50 sm:px-6"
                  >
                    <div className="flex items-start gap-4">
                      {/* Product Thumbnail */}
                      {review.productData?.thumbnail && (
                        <img
                          src={review.productData.thumbnail}
                          alt={review.productData.name}
                          className="hidden h-14 w-14 shrink-0 rounded-md border object-cover sm:block"
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        {/* Top Row */}
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-[#1a1f36]">
                              {review.productData?.name ?? "Unknown Product"}
                            </p>
                            <p className="text-sm text-gray-500">
                              by {review.user.firstName} {review.user.lastName}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {review.isVerifiedPurchase && (
                              <Badge variant="success" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Verified
                              </Badge>
                            )}
                            <span className="text-xs text-gray-400">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Rating + Title */}
                        <div className="mt-2 flex items-center gap-3">
                          <StarRating rating={review.rating} size="sm" />
                          {review.title && (
                            <span className="text-sm font-medium text-[#2d3436]">
                              {review.title}
                            </span>
                          )}
                        </div>

                        {/* Comment Preview or Full */}
                        <div className="mt-2">
                          {isExpanded ? (
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                              {review.comment}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-600">
                              {truncate(review.comment, 150)}
                            </p>
                          )}
                        </div>

                        {/* Review Images */}
                        {isExpanded && review.images && review.images.length > 0 && (
                          <div className="mt-3 flex gap-2">
                            {review.images.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt={`Review image ${i + 1}`}
                                className="h-16 w-16 rounded-md border object-cover"
                              />
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-2 flex items-center gap-2">
                          {review.comment.length > 150 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpandedId(isExpanded ? null : review._id)
                              }
                              className="text-xs text-gray-500"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="mr-1 h-3 w-3" /> Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="mr-1 h-3 w-3" /> More
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(review)}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="mr-1 h-3 w-3" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({data?.total ?? 0} reviews)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review by{" "}
              {deleteTarget?.user.firstName} {deleteTarget?.user.lastName}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
