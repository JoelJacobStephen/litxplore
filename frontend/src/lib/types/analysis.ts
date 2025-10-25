export type PaperMetadata = {
  paper_id: string;
  title: string;
  authors: string[];
  year?: number;
  url?: string;
  source: "upload" | "arxiv" | "url";
};

export type AtAGlanceAnalysis = {
  // Basic Information
  title: string;
  authors: string[];
  affiliations: string[];
  
  // Abstract & Keywords
  abstract: string;
  keywords: string[];
  
  // Paper Sections (in order)
  introduction: string;
  related_work: string;
  problem_statement: string;
  methodology: string;
  results: string;
  discussion: string;
  limitations: string[];
  future_work: string[];
  conclusion: string;
};

export type FigureExplanation = {
  label: string;
  caption: string;
  explanation: string;
  page: number;
};

export type KeyInsightsAnalysis = {
  figures: FigureExplanation[];
  limitations: string[];
  future_work: string[];
};

export type SuggestedQuestion = {
  question: string;
  category:
    | "methodology"
    | "results"
    | "limitations"
    | "applications"
    | "datasets"
    | "reproducibility";
};

export type InDepthAnalysis = {
  introduction: string;
  related_work: string;
  problem_statement: string;
  methodology: string;
  results: string;
  discussion: string;
  limitations: string;
  conclusion_future_work: string;
};

export type PaperAnalysis = {
  paper: PaperMetadata;
  at_a_glance: AtAGlanceAnalysis;
  key_insights?: KeyInsightsAnalysis | null;
  in_depth?: InDepthAnalysis | null;
  suggested_questions: SuggestedQuestion[];
  generated_at: string;
  schema_version: string;
  model_tag: string;
};
