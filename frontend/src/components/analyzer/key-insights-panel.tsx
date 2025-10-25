"use client";

import { KeyInsightsAnalysis } from "@/lib/types/analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Image } from "lucide-react";

interface KeyInsightsPanelProps {
  insights: KeyInsightsAnalysis;
}

export function KeyInsightsPanel({ insights }: KeyInsightsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Figures and Tables */}
      {insights.figures.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="h-4 w-4" />
              Figures & Tables
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.figures.map((fig, idx) => (
              <div key={idx} className="border-l-2 border-primary pl-3 py-1">
                <p className="text-sm font-semibold text-muted-foreground mb-1">
                  {fig.label} (Page {fig.page + 1})
                </p>
                <p className="text-base text-foreground">{fig.explanation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Limitations */}
      {insights.limitations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Limitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.limitations.map((limitation, idx) => (
                <li key={idx} className="flex gap-2 text-base">
                  <span className="text-amber-600 flex-shrink-0 mt-0.5">•</span>
                  <span className="text-foreground">{limitation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Future Work */}
      {insights.future_work.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Future Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.future_work.map((work, idx) => (
                <li key={idx} className="flex gap-2 text-base">
                  <span className="text-green-600 flex-shrink-0 mt-0.5">→</span>
                  <span className="text-foreground">{work}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
