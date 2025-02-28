"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function GradientBackground({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Main background gradient elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Base gradient layers */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,hsl(210,70%,40%)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_70%_60%,hsl(220,80%,50%)_0%,transparent_50%)]"></div>
        <motion.div
          className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_40%,hsl(200,100%,60%)_0%,transparent_40%)]"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </div>
      {children}
    </div>
  );
}
