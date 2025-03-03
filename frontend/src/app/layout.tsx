import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/lib/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { GradientBackground } from "@/components/ui/gradient-background";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LitXplore - Literature Review Generator",
  description: "Generate academic literature reviews using AI",
  icons: {
    icon: [
      { url: "/icons/favicon.ico", sizes: "any" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-icon.png" }],
    other: [
      { url: "/icons/icon.png", type: "image/png", sizes: "32x32" },
      {
        url: "/icons/web-app-manifest-192x192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/icons/web-app-manifest-512x512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
  },
  manifest: "/icons/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "min-h-screen bg-gray-950")}>
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <GradientBackground>
              <Header />
              <QueryProvider>
                <main className="flex-1">
                  {/* <SignedOut>
                    <SignInButton />
                  </SignedOut>
                  <SignedIn>
                    <UserButton />
                  </SignedIn> */}
                  {children}
                </main>
                <Toaster />
              </QueryProvider>
            </GradientBackground>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
