import toast, { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: "#ffffff",
          color: "#2d3436",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          padding: "12px 16px",
          fontSize: "14px",
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        },
        success: {
          iconTheme: {
            primary: "#16a34a",
            secondary: "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#dc2626",
            secondary: "#ffffff",
          },
        },
      }}
    />
  );
}

export function showToast(
  message: string,
  type: "success" | "error" | "info" = "info"
) {
  switch (type) {
    case "success":
      return toast.success(message);
    case "error":
      return toast.error(message);
    default:
      return toast(message, {
        icon: "ℹ️",
        style: {
          borderLeft: "4px solid #1a1f36",
        },
      });
  }
}

export { toast };
