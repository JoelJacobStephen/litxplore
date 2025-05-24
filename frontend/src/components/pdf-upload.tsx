import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Paper } from "@/lib/types/paper";
import { MAX_PAPERS_FOR_REVIEW } from "@/lib/constants";

interface PDFUploadProps {
  onPaperAdd: (paper: Paper) => void;
  currentPaperCount: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB in bytes

export function PDFUpload({ onPaperAdd, currentPaperCount }: PDFUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (currentPaperCount >= MAX_PAPERS_FOR_REVIEW) {
      toast.error(
        `You can only select up to ${MAX_PAPERS_FOR_REVIEW} papers for review`
      );
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds the limit of 15MB");
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
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail?.error?.message || "Failed to upload PDF"
        );
      }

      const paper: Paper = await response.json();
      onPaperAdd(paper);
      toast.success("PDF uploaded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload PDF"
      );
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (e.target.value) e.target.value = "";
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
