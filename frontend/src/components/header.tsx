import Link from "next/link";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          LitXplore
        </Link>
        <nav className="space-x-4">
          <Link href="/search" className="hover:text-primary">
            Search Papers
          </Link>
          <Link href="/review" className="hover:text-primary">
            Generate Review
          </Link>
        </nav>
      </div>
    </header>
  );
}
