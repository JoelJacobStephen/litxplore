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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden">
      {/* Main background gradient elements - consistent across the page */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Base gradient layers */}
        {/* <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,hsl(210,70%,40%)_0%,transparent_50%)]"></div> */}
        {/* <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_70%_60%,hsl(220,80%,50%)_0%,transparent_50%)]"></div> */}
        {/* <motion.div
          className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_40%,hsl(200,100%,60%)_0%,transparent_40%)]"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        /> */}
      </div>

      {/* Hero Section */}
      <div className="relative">
        {/* Hero content */}
        <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
              LitXplore
            </h1>
            <p className="text-xl text-gray-300 mb-10 leading-relaxed">
              Transform your research process with AI-powered literature reviews
              and interactive paper exploration
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-xl px-6"
                >
                  <Link href="/review" className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Generate Review</span>
                  </Link>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white rounded-xl px-6"
                >
                  <Link href="/search" className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    <span>Search & Chat</span>
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bento Grid Layout Section */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 text-white">
            Explore Our Features
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Powerful tools for researchers to explore scientific literature and
            generate comprehensive reviews
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 - Literature Review Generation */}
          <div className="col-span-1 md:col-span-2 relative">
            <motion.div
              className="h-full rounded-3xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/10 p-8 overflow-hidden relative group"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <BookOpenCheck className="h-10 w-10 text-blue-400 mb-4" />
              <h3 className="text-2xl font-semibold mb-3 text-white">
                Literature Review Generation
              </h3>
              <p className="text-gray-300 mb-6">
                Generate comprehensive literature reviews based on your research
                topic. Our AI analyzes papers and creates well-structured
                academic reviews with citations.
              </p>

              <Link href="/review" className="inline-block z-10 relative">
                <motion.div
                  className="flex items-center text-blue-400 font-medium"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  Generate Now <ArrowRight className="h-4 w-4 ml-1" />
                </motion.div>
              </Link>

              <div className="absolute bottom-4 right-4 opacity-10 pointer-events-none">
                <FileText className="h-24 w-24" />
              </div>
            </motion.div>
          </div>

          {/* Feature 2 - Chat with Papers */}
          <div className="col-span-1 relative">
            <motion.div
              className="h-full rounded-3xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/10 p-8 overflow-hidden relative group"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <MessageSquareText className="h-10 w-10 text-blue-400 mb-4" />
              <h3 className="text-2xl font-semibold mb-3 text-white">
                Chat with Papers
              </h3>
              <p className="text-gray-300 mb-6">
                Interact with research papers through natural conversation. Ask
                questions and get insights from any paper.
              </p>

              <Link href="/search" className="inline-block z-10 relative">
                <motion.div
                  className="flex items-center text-blue-400 font-medium"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  Start Chatting <ArrowRight className="h-4 w-4 ml-1" />
                </motion.div>
              </Link>

              <div className="absolute bottom-4 right-4 opacity-10 pointer-events-none">
                <BookMarked className="h-20 w-20" />
              </div>
            </motion.div>
          </div>

          {/* Feature 3 - Paper Search */}
          <div className="col-span-1 relative">
            <motion.div
              className="h-full rounded-3xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/10 p-8 overflow-hidden relative group"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Search className="h-10 w-10 text-blue-400 mb-4" />
              <h3 className="text-2xl font-semibold mb-3 text-white">
                Paper Search
              </h3>
              <p className="text-gray-300 mb-6">
                Search through millions of academic papers on arXiv. Filter by
                topic, author, or date to find relevant research.
              </p>

              <Link href="/search" className="inline-block z-10 relative">
                <motion.div
                  className="flex items-center text-blue-400 font-medium"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  Search Papers <ArrowRight className="h-4 w-4 ml-1" />
                </motion.div>
              </Link>
            </motion.div>
          </div>

          {/* Feature 4 - AI Analysis */}
          <div className="col-span-1 md:col-span-2 relative">
            <motion.div
              className="h-full rounded-3xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/10 p-8 overflow-hidden relative group"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="flex flex-col md:flex-row md:items-center gap-8">
                <div className="md:w-1/2">
                  <Sparkles className="h-10 w-10 text-blue-400 mb-4" />
                  <h3 className="text-2xl font-semibold mb-3 text-white">
                    Powered by Advanced AI
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Our platform uses state-of-the-art AI models to analyze
                    research papers, understand complex academic concepts, and
                    generate insights that help accelerate your research
                    process.
                  </p>

                  <Link href="/review" className="inline-block z-10 relative">
                    <motion.div
                      className="flex items-center text-blue-400 font-medium"
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      See How It Works <ArrowRight className="h-4 w-4 ml-1" />
                    </motion.div>
                  </Link>
                </div>

                <div className="md:w-1/2 flex justify-center items-center pointer-events-none">
                  <div className="relative">
                    {/* Animated particles */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute h-2 w-2 rounded-full bg-blue-400"
                          initial={{
                            x: 0,
                            y: 0,
                            opacity: 0.7,
                          }}
                          animate={{
                            x: Math.sin(i) * 80,
                            y: Math.cos(i) * 80,
                            opacity: [0.2, 0.8, 0.2],
                          }}
                          transition={{
                            duration: 3 + i,
                            repeat: Infinity,
                            repeatType: "reverse",
                          }}
                        />
                      ))}
                    </div>

                    <motion.div
                      className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center"
                      animate={{
                        boxShadow: [
                          "0 0 20px rgba(59, 130, 246, 0.3)",
                          "0 0 40px rgba(59, 130, 246, 0.5)",
                          "0 0 20px rgba(59, 130, 246, 0.3)",
                        ],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                    >
                      <Zap className="h-16 w-16 text-white" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 text-white">How It Works</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
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
              color: "from-blue-500 to-blue-700",
              delay: 0,
            },
            {
              step: "2",
              title: "AI Analysis",
              description:
                "Our AI analyzes relevant papers using advanced language models",
              color: "from-blue-600 to-blue-800",
              delay: 0.2,
            },
            {
              step: "3",
              title: "Get Your Results",
              description:
                "Receive a well-structured review with proper citations and insights",
              color: "from-blue-700 to-blue-900",
              delay: 0.4,
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: item.delay }}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                whileHover={{ y: -5, scale: 1.05 }}
                className={`w-16 h-16 rounded-full mb-4 bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl font-bold text-white`}
              >
                {item.step}
              </motion.div>
              <h3 className="text-xl font-semibold mb-2 text-white">
                {item.title}
              </h3>
              <p className="text-gray-400">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-xl px-8"
          >
            <Link href="/review">Get Started</Link>
          </Button>
        </motion.div> */}
      </div>
    </div>
  );
}
