"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewDisplayProps {
  review: string; // Make sure this matches the type from ReviewStore
}

export const ReviewDisplay = ({ review }: ReviewDisplayProps) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center"
      >
        <h2 className="text-2xl font-serif font-semibold text-zinc-200">
          Literature Review
        </h2>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="p-6 bg-zinc-900/50 border-zinc-800">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <motion.h1
                  variants={itemVariants}
                  className="text-3xl font-serif font-bold text-blue-500 mb-4"
                >
                  {children}
                </motion.h1>
              ),
              h2: ({ children }) => (
                <motion.h2
                  variants={itemVariants}
                  className="text-2xl font-serif font-semibold text-purple-500 mt-8 mb-4"
                >
                  {children}
                </motion.h2>
              ),
              h3: ({ children }) => (
                <motion.h3
                  variants={itemVariants}
                  className="text-xl font-serif font-medium text-zinc-200 mt-6 mb-3"
                >
                  {children}
                </motion.h3>
              ),
              p: ({ children }) => (
                <motion.p
                  variants={itemVariants}
                  className="text-zinc-300 leading-relaxed mb-4"
                >
                  {children}
                </motion.p>
              ),
              blockquote: ({ children }) => (
                <motion.blockquote
                  variants={itemVariants}
                  className="border-l-4 border-blue-500/50 pl-4 my-4 text-zinc-400 italic"
                >
                  {children}
                </motion.blockquote>
              ),
              ul: ({ children }) => (
                <motion.ul
                  variants={itemVariants}
                  className="list-disc list-inside space-y-2 mb-4 text-zinc-300"
                >
                  {children}
                </motion.ul>
              ),
              ol: ({ children }) => (
                <motion.ol
                  variants={itemVariants}
                  className="list-decimal list-inside space-y-2 mb-4 text-zinc-300"
                >
                  {children}
                </motion.ol>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-4"
                >
                  {children}
                </a>
              ),
              code: ({ children }) => (
                <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm text-purple-300">
                  {children}
                </code>
              ),
            }}
          >
            {review}
          </ReactMarkdown>
        </Card>
      </motion.div>
    </motion.div>
  );
};
