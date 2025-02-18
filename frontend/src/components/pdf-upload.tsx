import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Paper } from "@/lib/types/paper";

interface PDFUploadProps {
  onPaperAdd: (paper: Paper) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function PDFUpload({ onPaperAdd }: PDFUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/papers/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload PDF");
      }

      const paper: Paper = await response.json();
      onPaperAdd(paper);
      toast.success("PDF uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload PDF");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        disabled={isUploading}
        className="max-w-xs"
      />
      {isUploading && (
        <div className="flex items-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Uploading...
        </div>
      )}
    </div>
  );
}
