"use client";

import { SuggestedQuestion } from "@/lib/types/analysis";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  BarChart3,
  AlertCircle,
  Zap,
  Database,
  CheckCircle2,
} from "lucide-react";

interface SuggestedQuestionsPanelProps {
  questions: SuggestedQuestion[];
}

const categoryIcons: Record<SuggestedQuestion["category"], React.ReactNode> = {
  methodology: <Lightbulb className="h-4 w-4" />,
  results: <BarChart3 className="h-4 w-4" />,
  limitations: <AlertCircle className="h-4 w-4" />,
  applications: <Zap className="h-4 w-4" />,
  datasets: <Database className="h-4 w-4" />,
  reproducibility: <CheckCircle2 className="h-4 w-4" />,
};

const categoryColors: Record<
  SuggestedQuestion["category"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  methodology: "default",
  results: "secondary",
  limitations: "destructive",
  applications: "default",
  datasets: "secondary",
  reproducibility: "outline",
};

export function SuggestedQuestionsPanel({
  questions,
}: SuggestedQuestionsPanelProps) {
  return (
    <div className="space-y-3">
      <p className="text-base text-muted-foreground px-1">
        Questions to explore this paper further:
      </p>
      {questions.map((q, idx) => (
        <Card key={idx} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <div className="text-muted-foreground flex-shrink-0 mt-0.5">
                {categoryIcons[q.category]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-foreground mb-2">
                  {q.question}
                </p>
                <Badge
                  variant={categoryColors[q.category]}
                  className="text-xs capitalize"
                >
                  {q.category}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
