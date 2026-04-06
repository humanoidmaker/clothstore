import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";
import { apiPost, apiPut } from "@/lib/api";
import type { ApiResponse, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[6-9]\d{9}$/.test(v),
      "Enter a valid 10-digit phone number"
    ),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function AccountProfile() {
  const { user, updateProfile } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phone: user?.phone ?? "",
    },
  });

  const profileMutation = useMutation({
    mutationFn: (data: ProfileFormValues) => updateProfile(data),
    onSuccess: () => {
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await apiPost<ApiResponse<{ url: string }>>(
        "/upload",
        formData
      );
      await apiPut<ApiResponse<User>>("/auth/me", {
        avatar: uploadRes.data.url,
      });
      return uploadRes.data.url;
    },
    onSuccess: (url) => {
      setAvatarPreview(null);
      useAuthStore.setState((state) => ({
        user: state.user ? { ...state.user, avatar: url } : null,
      }));
      toast.success("Avatar updated");
    },
    onError: () => {
      setAvatarPreview(null);
      toast.error("Failed to upload avatar");
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    avatarMutation.mutate(file);
  };

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "";

  const onSubmit = (data: ProfileFormValues) => {
    profileMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1a1f36]">My Profile</h1>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              {avatarPreview || user?.avatar ? (
                <img
                  src={avatarPreview || user!.avatar}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1a1f36] text-xl font-semibold text-white">
                  {initials}
                </div>
              )}
              {avatarMutation.isPending && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarMutation.isPending}
              >
                <Camera className="h-4 w-4" />
                Change Photo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <p className="mt-1.5 text-xs text-gray-400">
                JPG, PNG or WebP. Max 2 MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...register("firstName")}
                  placeholder="First name"
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...register("lastName")}
                  placeholder="Last name"
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Input
                  id="email"
                  value={user?.email ?? ""}
                  readOnly
                  disabled
                  className="pr-28"
                />
                {user?.isEmailVerified && (
                  <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-medium text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="10-digit phone number"
                maxLength={10}
              />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!isDirty || profileMutation.isPending}
              >
                {profileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
