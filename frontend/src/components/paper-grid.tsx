"use client";

import { useState } from "react";
import { Paper } from "@/lib/api/generated";

// ArxivPaper is just Paper with required link field
type ArxivPaper = Paper & { link: string };
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleCheckBig, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface PaperGridProps {
  papers: (Paper | ArxivPaper)[];
  onPaperSelect?: (paperID: string, selected: boolean) => void;
  selectedPapers?: Set<string>;
  isLoading?: boolean;
  enableSelection?: boolean;
  enableChat?: boolean;
}

export function PaperGrid({
  papers,
  onPaperSelect,
  selectedPapers = new Set(),
  isLoading,
  enableSelection = false,
  enableChat = false,
}: PaperGridProps) {
  const router = useRouter();
  const [localSelectedPapers, setLocalSelectedPapers] = useState<Set<string>>(
    new Set()
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  const togglePaper = (paperId: string) => {
    const newSelected = new Set(localSelectedPapers);
    if (newSelected.has(paperId)) {
      newSelected.delete(paperId);
    } else {
      newSelected.add(paperId);
    }
    setLocalSelectedPapers(newSelected);
    if (onPaperSelect) {
      onPaperSelect(paperId, newSelected.has(paperId));
    }
  };

  const effectiveSelectedPapers = onPaperSelect
    ? selectedPapers
    : localSelectedPapers;

  if (isLoading) {
    return (
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {[1, 2, 3].map((i) => (
          <motion.div key={i} variants={cardVariants}>
            <Card className="relative hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <div className="m-2 space-y-6">
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence>
          {papers?.map((paper) => (
            <motion.div
              key={paper.id}
              variants={cardVariants}
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 },
              }}
              className="h-full"
            >
              <Card
                className={`flex flex-col h-full relative hover:shadow-lg transition-all overflow-hidden group ${
                  effectiveSelectedPapers.has(paper.id)
                    ? "border-blue-500"
                    : "border-gray-800"
                }`}
              >
                {/* Blue gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <CardHeader className="relative z-10">
                  <CardTitle className="line-clamp-2 text-xl font-serif">
                    {paper.title}
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    {paper.authors.slice(0, 3).join(", ")}
                    {paper.authors.length > 3 && " et al."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 relative z-10">
                  <p className="text-sm text-zinc-300 line-clamp-4 leading-relaxed">
                    {paper.summary}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t border-zinc-800 relative z-10">
                  {enableSelection && (
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={
                          effectiveSelectedPapers.has(paper.id)
                            ? "default"
                            : "ghost"
                        }
                        size="sm"
                        onClick={() => togglePaper(paper.id)}
                        className=" transition-colors"
                      >
                        <CircleCheckBig className="h-4 w-4 mr-2" />
                        {effectiveSelectedPapers.has(paper.id)
                          ? "Selected"
                          : "Select"}
                      </Button>
                    </motion.div>
                  )}
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="hover:bg-zinc-800 transition-colors"
                    >
                      {(("link" in paper && paper.link) || paper.url) && (
                        <Link
                          href={
                            ("link" in paper && paper.link) || paper.url || "#"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View PDF
                        </Link>
                      )}
                    </Button>
                  </motion.div>
                  <div className="flex gap-2">
                    {enableChat && (
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            router.push(`/papers/${paper.id}/chat`)
                          }
                          className="bg-blue-800 hover:bg-zinc-700 transition-colors"
                        >
                          Chat with Paper
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
