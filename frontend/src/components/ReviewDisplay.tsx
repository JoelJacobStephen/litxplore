import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Paper } from "@mui/material";

interface ReviewDisplayProps {
  review: string;
}

export const ReviewDisplay = ({ review }: ReviewDisplayProps) => {
  return (
    <Paper sx={{ p: 3, my: 2 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 style={{ color: "#1976d2", marginBottom: "0.5em" }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ color: "#2196f3", marginBottom: "0.5em" }}>
              {children}
            </h2>
          ),
          p: ({ children }) => (
            <p style={{ lineHeight: "1.6", marginBottom: "1em" }}>{children}</p>
          ),
          blockquote: ({ children }) => (
            <blockquote
              style={{
                borderLeft: "4px solid #1976d2",
                paddingLeft: "1em",
                margin: "1em 0",
                color: "#666",
              }}
            >
              {children}
            </blockquote>
          ),
        }}
      >
        {review}
      </ReactMarkdown>
    </Paper>
  );
};
