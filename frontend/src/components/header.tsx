"use client";

import Link from "next/link";
import { UserButton, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { Button } from "./ui/button";

export function Header() {
  const { isSignedIn } = useUser();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          LitXplore
        </Link>
        <nav className="flex items-center space-x-4">
          {isSignedIn ? (
            <>
              <Link href="/search" className="hover:text-primary">
                Search Papers
              </Link>
              <Link href="/review" className="hover:text-primary">
                Generate Review
              </Link>
              <Link href="/history" className="hover:text-primary">
                History
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <SignInButton mode="modal">
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Get Started</Button>
              </SignUpButton>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
