"use client";

interface PDFViewerProps {
  url: string | null | undefined;
}

export function PDFViewer({ url }: PDFViewerProps) {
  // Handle null/undefined URL
  if (!url) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-muted">
        <p className="text-muted-foreground">No PDF available</p>
      </div>
    );
  }

  // Ensure URL is using HTTPS
  const secureUrl = url.startsWith("https://")
    ? url
    : url.startsWith("http://")
    ? url.replace("http://", "https://")
    : `https://${url}`;

  return (
    <iframe
      src={secureUrl}
      className="w-full h-full"
      style={{
        height: "100%",
        display: "block",
      }}
    />
  );
}
