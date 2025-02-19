"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-6">LitXplore</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Generate comprehensive academic literature reviews powered by AI.
          Search through arXiv papers, analyze research, and create
          well-structured reviews in minutes.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex flex-col items-center text-center space-y-4">
            <Search className="w-12 h-12 text-primary" />
            <h2 className="text-2xl font-semibold">Search Papers</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Search through millions of academic papers on arXiv. Filter by
              topic, author, or date to find relevant research.
            </p>
            <Button asChild>
              <Link href="/search">Start Searching</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex flex-col items-center text-center space-y-4">
            <BookOpen className="w-12 h-12 text-primary" />
            <h2 className="text-2xl font-semibold">Generate Review</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Generate comprehensive literature reviews using AI. Our system
              analyzes papers and creates well-structured academic reviews.
            </p>
            <Button asChild>
              <Link href="/review">Generate Review</Link>
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-3xl font-semibold mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div>
            <div className="text-2xl font-bold text-primary mb-2">1</div>
            <h3 className="text-xl font-semibold mb-2">Enter Your Topic</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Specify your research topic and the number of papers to analyze
            </p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary mb-2">2</div>
            <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our AI analyzes relevant papers using advanced language models
            </p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary mb-2">3</div>
            <h3 className="text-xl font-semibold mb-2">Get Your Review</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Receive a well-structured review with proper citations and
              insights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
