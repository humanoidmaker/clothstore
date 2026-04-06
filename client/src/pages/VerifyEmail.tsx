import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Loader2 } from "lucide-react";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { ApiResponse } from "@/types";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const submitCode = useCallback(
    async (code: string) => {
      setIsVerifying(true);
      setError("");
      try {
        await apiPost<ApiResponse<null>>("/auth/verify-email", { email, code });
        toast.success("Email verified successfully! Please sign in.");
        navigate("/login", { replace: true });
      } catch (err: any) {
        const message = err?.response?.data?.message || "Invalid verification code";
        setError(message);
        setDigits(Array(CODE_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      } finally {
        setIsVerifying(false);
      }
    },
    [email, navigate]
  );

  function handleChange(index: number, value: string) {
    // Allow only digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError("");

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are filled
    if (digit && index === CODE_LENGTH - 1) {
      const code = newDigits.join("");
      if (code.length === CODE_LENGTH) {
        submitCode(code);
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pastedText) return;

    const newDigits = [...digits];
    for (let i = 0; i < pastedText.length; i++) {
      newDigits[i] = pastedText[i];
    }
    setDigits(newDigits);

    // Focus the next empty input or the last one
    const nextEmpty = newDigits.findIndex((d) => !d);
    const focusIndex = nextEmpty === -1 ? CODE_LENGTH - 1 : nextEmpty;
    inputRefs.current[focusIndex]?.focus();

    // Auto-submit if full code pasted
    if (pastedText.length === CODE_LENGTH) {
      submitCode(pastedText);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await apiPost<ApiResponse<null>>("/auth/resend-verification", { email });
      toast.success("Verification code sent!");
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  }

  function handleVerifyClick() {
    const code = digits.join("");
    if (code.length === CODE_LENGTH) {
      submitCode(code);
    }
  }

  const isCodeComplete = digits.every((d) => d !== "");

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1a1f36]/5">
            <Mail className="h-8 w-8 text-[#1a1f36]" />
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-[#1a1f36]">Verify Your Email</h1>
            <p className="mt-2 text-sm text-gray-500">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-[#2d3436]">{email || "your email"}</span>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {/* OTP Inputs */}
          <div className="mb-6 flex justify-center gap-2.5" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isVerifying}
                className="h-12 w-12 rounded-lg border-2 border-gray-200 bg-white text-center text-lg font-bold text-[#1a1f36] transition-all focus:border-[#1a1f36] focus:outline-none focus:ring-2 focus:ring-[#1a1f36]/20 disabled:opacity-50"
              />
            ))}
          </div>

          {/* Verify Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleVerifyClick}
            disabled={!isCodeComplete || isVerifying}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>

          {/* Resend */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Didn't receive the code?{" "}
              {cooldown > 0 ? (
                <span className="font-medium text-gray-400">Resend in {cooldown}s</span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="font-medium text-[#1a1f36] transition-colors hover:text-[#c8a96e] disabled:opacity-50"
                >
                  {isResending ? "Sending..." : "Resend"}
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
