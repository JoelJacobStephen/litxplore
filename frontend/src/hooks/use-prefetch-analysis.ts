import { useCallback } from "react";
import { analysisApi } from "@/lib/api/analysis";

export function usePrefetchAnalysis() {
  /**
   * Prefetch analysis for a paper on hover.
   * Checks cache first, then fetches if not cached.
   * Non-blocking operation - errors are silently ignored.
   */
  const prefetch = useCallback(async (paperId: string) => {
    try {
      // Check if already cached
      const cached = await analysisApi.getPaperAnalysis(paperId);
      if (cached) {
        return; // Already cached, no need to prefetch
      }

      // Prefetch in background (don't await)
      analysisApi.analyzePaper(paperId, false).catch((err) => {
        // Silently ignore prefetch errors
        console.debug(`Prefetch failed for ${paperId}:`, err);
      });
    } catch (err) {
      // Silently ignore prefetch errors
      console.debug(`Prefetch check failed for ${paperId}:`, err);
    }
  }, []);

  return { prefetch };
}
