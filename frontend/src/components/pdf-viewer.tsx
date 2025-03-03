"use client";

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
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
