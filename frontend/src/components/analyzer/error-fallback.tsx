"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorFallbackProps {
  title: string;
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorFallback({
  title,
  message,
  onRetry,
  showRetry = true,
}: ErrorFallbackProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-destructive mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{message}</p>
            {showRetry && onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="gap-2"
              >
                <RotateCcw className="h-3 w-3" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
