"use client";

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  // Google Docs viewer may be blocked by CORS or not support all PDF URLs
  // Consider using a PDF.js or alternative PDF viewer library
  return (
    <div className="w-full h-full">
      <object
        data={url}
        type="application/pdf"
        className="w-full h-full border-0"
      >
        <iframe
          src={`https://docs.google.com/viewer?url=${encodeURIComponent(
            url
          )}&embedded=true`}
          className="w-full h-full border-0"
        />
      </object>
    </div>
  );
}
