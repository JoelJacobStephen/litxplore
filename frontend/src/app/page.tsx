"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  ArrowRight,
  BookOpenCheck,
  MessageSquareText,
  Sparkles,
  Zap,
  FileText,
  BookMarked,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative">
        {/* Hero content */}
        <div className="container mx-auto px-4 pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-6xl font-bold mb-6 text-foreground tracking-tight">
              LitXplore
            </h1>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
              Transform your research process with AI-powered literature reviews
              and interactive paper exploration
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="rounded-xl px-6">
                <Link href="/review" className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Generate Review</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-xl px-6"
              >
                <Link href="/search" className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  <span>Search & Chat</span>
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bento Grid Layout Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 text-foreground tracking-tight">
            Explore Our Features
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Powerful tools for researchers to explore scientific literature and
            generate comprehensive reviews
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 - Literature Review Generation */}
          <div className="col-span-1 md:col-span-2 relative">
            <motion.div
              className="h-full rounded-2xl bg-card border border-border p-8 overflow-hidden relative group hover:border-primary/50"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <BookOpenCheck className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3 text-foreground tracking-tight">
                Literature Review Generation
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Generate comprehensive literature reviews based on your research
                topic. It analyzes papers and creates well-structured academic
                reviews with citations.
              </p>

              <Link href="/review" className="inline-block relative">
                <span className="flex items-center text-primary font-medium hover:text-primary/80 transition-colors duration-200">
                  Generate Now <ArrowRight className="h-4 w-4 ml-1" />
                </span>
              </Link>

              <div className="absolute bottom-4 right-4 opacity-5 pointer-events-none">
                <FileText className="h-24 w-24" />
              </div>
            </motion.div>
          </div>

          {/* Feature 2 - Paper Analyzer */}
          <div className="col-span-1 relative">
            <motion.div
              className="h-full rounded-2xl bg-card border border-border p-8 overflow-hidden relative group hover:border-primary/50"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <MessageSquareText className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3 text-foreground tracking-tight">
                Paper Analyzer
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Get instant insights from research papers with AI-powered analysis.
                Explore key findings, methodology, and ask follow-up questions.
              </p>

              <Link href="/search" className="inline-block relative">
                <span className="flex items-center text-primary font-medium hover:text-primary/80 transition-colors duration-200">
                  Analyze Papers <ArrowRight className="h-4 w-4 ml-1" />
                </span>
              </Link>

              <div className="absolute bottom-4 right-4 opacity-5 pointer-events-none">
                <BookMarked className="h-20 w-20" />
              </div>
            </motion.div>
          </div>

          {/* Feature 3 - Paper Search */}
          <div className="col-span-1 relative">
            <motion.div
              className="h-full rounded-2xl bg-card border border-border p-8 overflow-hidden relative group hover:border-primary/50"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <Search className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3 text-foreground tracking-tight">
                Paper Search
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Search through millions of academic papers on arXiv.
              </p>

              <Link href="/search" className="inline-block relative">
                <span className="flex items-center text-primary font-medium hover:text-primary/80 transition-colors duration-200">
                  Search Papers <ArrowRight className="h-4 w-4 ml-1" />
                </span>
              </Link>
            </motion.div>
          </div>

          {/* Feature 4 - AI Analysis */}
          <div className="col-span-1 md:col-span-2 relative">
            <motion.div
              className="h-full rounded-2xl bg-card border border-border p-8 overflow-hidden relative group hover:border-primary/50"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-8">
                <div className="md:w-1/2">
                  <Sparkles className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-2xl font-semibold mb-3 text-foreground tracking-tight">
                    Powered by AI
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    The platform fetches relevant papers from arXiv and uses
                    state-of-the-art AI models to analyze research papers,
                    understand complex academic concepts, and generate detailed
                    literature reviews that help accelerate your research
                    process.
                  </p>

                  <Link href="/review" className="inline-block relative">
                    <span className="flex items-center text-primary font-medium hover:text-primary/80 transition-colors duration-200">
                      See How It Works <ArrowRight className="h-4 w-4 ml-1" />
                    </span>
                  </Link>
                </div>

                <div className="md:w-1/2 flex justify-center items-center">
                  <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="h-16 w-16 text-primary" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 text-foreground tracking-tight">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transform your research process in three simple steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              step: "1",
              title: "Enter Your Topic",
              description:
                "Specify your research topic and the number of papers to analyze",
              delay: 0,
            },
            {
              step: "2",
              title: "AI Analysis",
              description:
                "The platform analyzes relevant papers using advanced language models",
              delay: 0.1,
            },
            {
              step: "3",
              title: "Get Your Results",
              description:
                "Receive a well-structured review with proper citations and insights",
              delay: 0.2,
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: item.delay }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full mb-4 bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border border-primary/20">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground tracking-tight">
                {item.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
