"use client";

import Link from "next/link";
import { UserButton, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, BookOpen, Clock, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      href: "/search",
      label: "Search Papers",
      icon: <Search className="h-5 w-5" />,
    },
    {
      href: "/review",
      label: "Generate Review",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      href: "/history",
      label: "History",
      icon: <Clock className="h-5 w-5" />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-2">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                LitXplore
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {isSignedIn &&
              navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-md text-muted-foreground transition-colors hover:text-primary hover:bg-muted",
                    pathname === item.href && "text-primary bg-muted"
                  )}
                  title={item.label}
                >
                  {item.icon}
                </Link>
              ))}

            {isSignedIn ? (
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-9 w-9 ml-2",
                  },
                }}
              />
            ) : (
              <div className="flex items-center space-x-2">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">Get Started</Button>
                </SignUpButton>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="flex md:hidden items-center justify-center h-10 w-10 rounded-md text-muted-foreground hover:text-primary hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container mx-auto px-4 py-3 flex flex-col space-y-3">
            {isSignedIn ? (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:text-primary hover:bg-muted",
                      pathname === item.href && "text-primary bg-muted"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </>
            ) : (
              <div className="flex flex-col space-y-2 py-2">
                <SignInButton mode="modal">
                  <Button variant="outline" className="w-full justify-start">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="w-full justify-start">Get Started</Button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
