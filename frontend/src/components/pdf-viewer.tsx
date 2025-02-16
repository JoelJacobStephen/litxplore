"use client";

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  return (
    <iframe src={url} className="w-full h-full" style={{ minHeight: "100%" }} />
  );
}
