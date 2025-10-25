"use client";

import { AtAGlanceAnalysis } from "@/lib/types/analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AtAGlancePanelProps {
  analysis: AtAGlanceAnalysis;
}

export function AtAGlancePanel({ analysis }: AtAGlancePanelProps) {
  return (
    <div className="space-y-4">
      {/* One Sentence Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground">
            {analysis.one_sentence_summary}
          </p>
        </CardContent>
      </Card>

      {/* Key Contributions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Key Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.key_contributions.map((contribution, idx) => (
              <li key={idx} className="flex gap-3 text-sm">
                <span className="text-primary font-semibold flex-shrink-0">
                  {idx + 1}.
                </span>
                <span className="text-foreground">{contribution}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Methodology */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Methodology</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground">
            {analysis.methodology}
          </p>
        </CardContent>
      </Card>

      {/* Key Result */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Key Result</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground font-medium">
            {analysis.key_result}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
