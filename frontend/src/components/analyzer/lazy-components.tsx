"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

// Lazy load heavy components with loading fallback
export const LazyPDFViewer = dynamic(
  () => import("@/components/pdf-viewer").then((mod) => mod.PDFViewer),
  {
    loading: () => (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading PDF...</p>
      </div>
    ),
    ssr: false, // Disable SSR for PDF.js compatibility
  }
);

export const LazyKeyInsightsPanel = dynamic(
  () =>
    import("@/components/analyzer/key-insights-panel").then(
      (mod) => mod.KeyInsightsPanel
    ),
  {
    loading: () => (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    ),
  }
);

export const LazyChatPanel = dynamic(
  () =>
    import("@/components/analyzer/chat-panel").then((mod) => mod.ChatPanel),
  {
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading chat...</p>
      </div>
    ),
  }
);

export const LazyAtAGlanceCards = dynamic(
  () =>
    import("@/components/analyzer/at-a-glance-cards").then(
      (mod) => mod.AtAGlanceCards
    ),
  {
    loading: () => (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    ),
  }
);

export const LazySuggestedQuestionsPanel = dynamic(
  () =>
    import("@/components/analyzer/suggested-questions-panel").then(
      (mod) => mod.SuggestedQuestionsPanel
    ),
  {
    loading: () => (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    ),
  }
);
