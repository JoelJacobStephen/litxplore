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
    <header className="sticky top-0 z-50 w-full border-b border-gray-800/50 bg-gray-300/30 backdrop-blur supports-[backdrop-filter]:bg-gray-900/5">
      <div className="container mx-auto px-4 py-2">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
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
                    "flex items-center justify-center h-10 w-10 rounded-md text-gray-300 transition-colors hover:text-blue-400 hover:bg-blue-900/20",
                    pathname === item.href && "text-blue-400 bg-blue-900/20"
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
                  <Button variant="gradient" size="sm">
                    Get Started
                  </Button>
                </SignUpButton>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="flex md:hidden items-center justify-center h-10 w-10 rounded-md text-gray-300 hover:text-blue-400 hover:bg-blue-900/20 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <div className="relative w-5 h-5">
              <X
                className={cn(
                  "absolute inset-0 h-5 w-5 transition-all duration-200",
                  mobileMenuOpen
                    ? "opacity-100 rotate-0"
                    : "opacity-0 rotate-90"
                )}
              />
              <Menu
                className={cn(
                  "absolute inset-0 h-5 w-5 transition-all duration-200",
                  mobileMenuOpen
                    ? "opacity-0 -rotate-90"
                    : "opacity-100 rotate-0"
                )}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "md:hidden fixed inset-x-0 top-[3.5rem] border-t border-gray-800/50 bg-gray-900/95 backdrop-blur-sm transition-all duration-200 ease-in-out",
          mobileMenuOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-2 opacity-0 pointer-events-none"
        )}
      >
        <div className="container mx-auto px-4 py-3">
          {isSignedIn ? (
            <div className="flex flex-col space-y-4">
              {/* User Profile Section */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-gray-800/30">
                <div className="flex items-center space-x-3">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "h-10 w-10",
                        userButtonTrigger:
                          "hover:opacity-80 transition-opacity",
                      },
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-200">
                      Your Account
                    </span>
                    <span className="text-xs text-gray-400">
                      Manage your profile
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Menu */}
              <div className="bg-gray-900/20 backdrop-blur-sm rounded-lg border border-gray-800/30 overflow-hidden">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-blue-400 transition-colors border-b border-gray-800/20 last:border-none",
                      pathname === item.href && "text-blue-400 bg-blue-900/30"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-2 py-2">
              <SignInButton mode="modal">
                <Button variant="outline" className="w-full justify-start">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="gradient" className="w-full justify-start">
                  Get Started
                </Button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
