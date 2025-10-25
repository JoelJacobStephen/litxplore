import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export type ToastType = "success" | "error" | "warning" | "info";

export function useToastNotification() {
  const { toast } = useToast();

  const showToast = useCallback(
    (
      title: string,
      description?: string,
      type: ToastType = "info",
      duration: number = 5000
    ) => {
      const variantMap: Record<ToastType, "default" | "destructive"> = {
        success: "default",
        error: "destructive",
        warning: "default",
        info: "default",
      };

      toast({
        title,
        description,
        variant: variantMap[type],
        duration,
      });
    },
    [toast]
  );

  return {
    success: (title: string, description?: string) =>
      showToast(title, description, "success"),
    error: (title: string, description?: string) =>
      showToast(title, description, "error"),
    warning: (title: string, description?: string) =>
      showToast(title, description, "warning"),
    info: (title: string, description?: string) =>
      showToast(title, description, "info"),
  };
}
