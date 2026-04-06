import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Mail, Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiResponse } from "@/types";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setIsSubmitting(true);
    setServerError("");
    try {
      await apiPost<ApiResponse<null>>("/auth/forgot-password", { email: data.email });
      toast.success("Reset code sent to your email!");
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`, { replace: true });
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to send reset code. Please try again.";
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
          {/* Back Link */}
          <Link
            to="/login"
            className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-[#1a1f36]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>

          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#c8a96e]/10">
            <KeyRound className="h-8 w-8 text-[#c8a96e]" />
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-[#1a1f36]">Forgot Password?</h1>
            <p className="mt-2 text-sm text-gray-500">
              Enter your email and we'll send you a reset code
            </p>
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
              {serverError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="pl-9"
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Code"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
