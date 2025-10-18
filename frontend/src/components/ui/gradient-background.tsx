"use client";

import { cn } from "@/lib/utils";

export function GradientBackground({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return <div className={cn("relative", className)}>{children}</div>;
}
