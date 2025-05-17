# LitXplore Frontend Overview

## Tech Stack

LitXplore is built with a modern React-based frontend stack:

- **Next.js 13.5.1** - React framework with app router for server components and routing
- **TypeScript** - Static typing for more robust code
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Clerk** - Authentication and user management
- **Zustand** - Lightweight state management
- **React Query** - Data fetching, caching, and state management
- **Radix UI** - Headless UI components for accessibility
- **shadcn/ui** - Component library built on Radix UI with Tailwind styling
- **React Hook Form** - Form validation and handling
- **Zod** - Schema validation
- **Framer Motion** - Animation library
- **Recharts** - Charting library for data visualization

## Project Structure

The frontend follows Next.js App Router structure:

```
frontend/
├── .next/               # Next.js build output
├── public/              # Static files
│   └── icons/           # App icons and favicons
├── src/
│   ├── app/             # App router pages and API routes
│   ├── components/      # Reusable React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions, services, types, etc.
│   ├── middleware.ts    # Next.js middleware (auth protection)
│   └── types/           # TypeScript type definitions
├── package.json         # Dependencies and scripts
├── next.config.js       # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Authentication

LitXplore uses Clerk for authentication:

- Configured in `middleware.ts` to protect routes
- Public routes: homepage and search page
- Private routes: dashboard, account, history, etc.
- Auth middleware ensures users are signed in to access protected routes

```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/search"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

## Routing Structure

The app uses Next.js App Router for file-based routing:

- `/` - Homepage
- `/search` - Paper search page
- `/papers/[paperId]` - Individual paper details and chat
- `/review` - Literature review generation interface
- `/generated-review/[id]` - View generated literature review
- `/history` - View history of generated reviews and chat sessions
- `/account` - User account management
- `/dashboard` - User dashboard (protected)
- `/sign-in`, `/sign-up` - Authentication pages
- `/subscription` - Subscription management

API routes are structured under `/app/api/`:

- `/api/auth/*` - Authentication endpoints
- `/api/chat/*` - Chat functionality
- `/api/history/*` - User history endpoints
- `/api/reviews/*` - Literature review endpoints

## Components

The application uses a mix of custom components and shadcn/ui components:

### Main Components

- `Header`: Navigation header with site logo and links
- `ChatInterface`: Interactive chat interface for papers
- `SearchInput`: Search functionality for academic papers
- `ReviewDisplay`: Component for displaying generated reviews
- `PaperGrid`: Grid layout for displaying paper search results
- `PDFViewer`: Component for viewing research papers in PDF format
- `ChatMessageBubble`: Component for displaying chat messages

### UI Components

The project heavily utilizes shadcn/ui components built on Radix UI:

- Dialog
- Button
- Toast
- Form
- Tabs
- Accordion
- Dropdown
- and many more

## State Management

### Zustand Stores

The application uses Zustand for lightweight state management:

```typescript
// review-store.ts
import { create } from "zustand";
import { Paper } from "../types/paper";

interface ReviewState {
  generatedReview: {
    review: string;
    citations: Paper[];
    topic: string;
  } | null;
  setGeneratedReview: (review: {
    review: string;
    citations: Paper[];
    topic: string;
  }) => void;
  clearGeneratedReview: () => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  generatedReview: null,
  setGeneratedReview: (review) => set({ generatedReview: review }),
  clearGeneratedReview: () => set({ generatedReview: null }),
}));
```

### React Query

Used for data fetching, caching, and server state management:

```typescript
// query-provider.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

## Data Services

The application communicates with the backend API through service modules:

### Paper Service

Handles paper search and chat functionality:

```typescript
// paper-service.ts
export async function searchPapers(query: string): Promise<Paper[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/papers/search?query=${encodeURIComponent(query)}`
    );
    // Process response...
  } catch (error) {
    // Handle error...
  }
}

export async function chatWithPaper(
  paperId: string,
  message: string
): Promise<ChatResponse> {
  // Implementation...
}

export const streamChat = async (
  paperId: string,
  message: string,
  model: string = "gemini-2.0-flash",
  customSystemPrompt?: string
): Promise<Response> => {
  // Implementation...
};
```

### Review Service

Handles literature review generation:

```typescript
export async function generateReview({
  papers,
  topic,
}: {
  papers: string[];
  topic: string;
}): Promise<ReviewResponse> {
  // Implementation...
}

export async function getReview(id: string): Promise<ReviewResponse> {
  // Implementation...
}
```

## TypeScript Types

The application uses TypeScript for type safety with key interfaces:

```typescript
// paper.ts
export interface Paper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  link?: string;
  url?: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  sources?: Array<{ page: number }>;
  id?: string;
}

export interface ReviewContent {
  review: string;
  citations: Paper[];
  topic: string;
}
```

## Theme and Styling

The app uses Tailwind CSS for styling with a theme provider for dark/light mode:

```typescript
// theme-provider.tsx
<ThemeProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem
  disableTransitionOnChange
>
  {/* App content */}
</ThemeProvider>
```

## Key Features

1. **Paper Search**: Search academic papers from various sources
2. **Chat with Paper**: AI-powered chat interface to query specific papers
3. **Literature Review Generation**: Generate comprehensive reviews from multiple papers
4. **History Tracking**: Save and view past reviews and chat sessions
5. **PDF Viewing**: Read papers directly in the application
6. **Authentication**: User accounts with Clerk
7. **Responsive Design**: Works on mobile, tablet, and desktop

## Rendering Strategy

LitXplore uses Next.js's hybrid rendering approach:

- Server Components for initial page loads and SEO
- Client Components for interactive elements
- Streaming responses for chat functionality

## Conclusion

The LitXplore frontend is a modern React application built with Next.js, featuring a clean architecture that separates concerns between UI components, data fetching, and state management. The application provides a user-friendly interface for academic paper exploration and literature review generation with AI-powered features.
