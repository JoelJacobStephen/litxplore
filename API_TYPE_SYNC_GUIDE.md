# 🔄 API Type Synchronization Guide

**Complete guide to understanding how LitXplore keeps backend and frontend perfectly in sync**

---

## 📖 Table of Contents

1. [What Is This System?](#what-is-this-system)
2. [How It Works (Simple Explanation)](#how-it-works-simple-explanation)
3. [Architecture Overview](#architecture-overview)
4. [Development Workflows](#development-workflows)
5. [Commands Reference](#commands-reference)
6. [Using Generated API Hooks](#using-generated-api-hooks)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## What Is This System?

LitXplore uses **automatic type synchronization** between the backend (FastAPI/Python) and frontend (Next.js/TypeScript). This means:

✅ **Any change to backend models automatically updates frontend types**  
✅ **TypeScript catches breaking changes before you deploy**  
✅ **No manual type definitions needed**  
✅ **Full autocomplete and IntelliSense in your IDE**  
✅ **Ready-to-use TanStack Query hooks for all API calls**

### The Problem It Solves

**Before:**

```typescript
// ❌ Manual types that get out of sync
interface Paper {
  title: string;
  // Oops! Backend added "authors" field but we forgot to update this
}

// ❌ Manual API calls with no type safety
const response = await fetch(`/api/papers/${id}`);
const data = await response.json(); // What type is this? 🤷
```

**After:**

```typescript
// ✅ Auto-generated types that always match backend
import { Paper, useGetPaper } from "@/lib/api/generated";

// ✅ Fully type-safe API call
const { data } = useGetPaper(paperId);
// data is typed as Paper | undefined
// TypeScript shows error if backend changes!
```

---

## How It Works (Simple Explanation)

### The Flow in 3 Steps

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Backend Developer                                             │
│    Edits backend/app/models/paper.py                            │
│    Changes Paper model (e.g., adds new field "abstract")        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Automatic Sync (3-5 seconds)                                 │
│    • Backend watcher detects Python file change                 │
│    • Fetches latest OpenAPI schema from FastAPI                 │
│    • Saves to backend/openapi.json                              │
│    • Frontend watcher detects openapi.json change               │
│    • Orval regenerates TypeScript types & hooks                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Frontend Developer                                           │
│    TypeScript immediately shows errors in VS Code:              │
│    "Property 'abstract' is missing in type 'Paper'"             │
│    → Fix the code → Next.js hot reloads → Done! ✅              │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **FastAPI Backend** - Auto-generates OpenAPI schema from Python Pydantic models
2. **Backend Watcher** - Watches Python files, exports schema to `backend/openapi.json`
3. **OpenAPI Schema File** - `backend/openapi.json` - The "bridge" between backend and frontend
4. **Sync Script** - `npm run sync:openapi` copies the backend spec to `frontend/openapi.json`
5. **Orval** - Code generator that reads the synced schema and creates TypeScript types
6. **Frontend Watcher** - Watches `frontend/openapi.json`, triggers Orval regeneration
7. **Generated Code** - `frontend/src/lib/api/generated/` - TypeScript types and hooks

---

### Frontend Schema Copy Explained

- `frontend/openapi.json` is a **generated copy** of the backend spec. It lives in the frontend because Vercel (and other CI environments) only have access to the frontend folder during the build step.
- The `sync:openapi` npm script (and the backend watcher) copy `backend/openapi.json` into the frontend folder. You rarely run it directly; it is invoked automatically by `generate:api`, `generate:api:watch`, and the `prebuild` hook (`npm run build`).
- Never edit `frontend/openapi.json` by hand—treat it as an artifact that should always match the backend version.
- When committing backend changes that affect the API, commit both `backend` Python updates **and** `backend/openapi.json`. The frontend copy can be regenerated at any time via the scripts above.

---

## Architecture Overview

### Full System Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Python)                             │
│                                                                        │
│  ┌──────────────────────┐         ┌─────────────────────────┐        │
│  │  Pydantic Models     │         │  FastAPI Endpoints       │        │
│  │  app/models/         │  ────>  │  app/api/v1/endpoints/  │        │
│  │                      │         │                          │        │
│  │  • paper.py          │         │  • papers.py             │        │
│  │  • review.py         │         │  • review.py             │        │
│  │  • task.py           │         │  • tasks.py              │        │
│  └──────────────────────┘         └────────────┬────────────┘        │
│                                                 │                      │
│                                                 │ Auto-generates       │
│                                                 ▼                      │
│  ┌───────────────────────────────────────────────────────────┐       │
│  │  OpenAPI Schema (Live)                                     │       │
│  │  http://localhost:8000/api/v1/openapi.json                 │       │
│  │  • Describes all endpoints                                 │       │
│  │  • Includes request/response types                         │       │
│  │  • Single source of truth                                  │       │
│  └───────────────────────────────┬───────────────────────────┘       │
│                                   │                                    │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │
                                    │ Exported by watcher
                                    ▼
                    ┌───────────────────────────────┐
                    │  backend/openapi.json         │
                    │  (Committed to Git)           │
                    └───────────────┬───────────────┘
                                    │
                                    │ Copied by npm run sync:openapi
                                    ▼
                    ┌───────────────────────────────┐
                    │  frontend/openapi.json        │
                    │  (Copied spec for builds)     │
                    └───────────────┬───────────────┘
                                    │
                                    │ Watched by Orval
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (TypeScript)                           │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────┐         │
│  │  Orval (Code Generator)                                  │         │
│  │  Reads frontend/openapi.json                             │         │
│  │  Generates TypeScript code                               │         │
│  └──────────────────────────┬──────────────────────────────┘         │
│                              │                                         │
│                              │ Generates                               │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐         │
│  │  frontend/src/lib/api/generated/                         │         │
│  │  (Auto-generated - DO NOT EDIT)                          │         │
│  │                                                           │         │
│  │  • models/index.ts      ← TypeScript interfaces          │         │
│  │  • papers.ts            ← Paper API hooks                │         │
│  │  • review.ts            ← Review API hooks               │         │
│  │  • tasks.ts             ← Task API hooks                 │         │
│  │  • index.ts             ← Main exports                   │         │
│  └──────────────────────────┬──────────────────────────────┘         │
│                              │                                         │
│                              │ Used by                                 │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐         │
│  │  React Components                                        │         │
│  │  src/app/, src/components/                               │         │
│  │                                                           │         │
│  │  import { useSearchPapers } from '@/lib/api/generated'   │         │
│  │                                                           │         │
│  │  const { data } = useSearchPapers({ query: "AI" });      │         │
│  │  // data is fully typed! ✅                              │         │
│  └─────────────────────────────────────────────────────────┘         │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Python Model Change
       ↓
Uvicorn Hot Reload
       ↓
OpenAPI Schema Updates (live at /api/v1/openapi.json)
       ↓
Backend Watcher Detects Change (watches app/**/*.py)
       ↓
Fetches & Saves openapi.json (backend/openapi.json)
       ↓
Sync Script / Watcher Copies Spec (frontend/openapi.json)
       ↓
Orval Regenerates Code (frontend/src/lib/api/generated/)
       ↓
TypeScript Compiler Shows Errors (if API changed)
       ↓
Developer Fixes Code
       ↓
Next.js Hot Reloads
       ↓
Done! ✅
```

**Total Time: 3-5 seconds from backend edit to frontend updated**

---

## Development Workflows

### Option 1: Full Stack Development (Recommended)

Run both backend and frontend together for the full automatic experience.

> **New in 2025:** both the watcher and npm build scripts keep `frontend/openapi.json` in sync automatically. No manual copying required.

#### Terminal 1: Backend

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**What it does:**

- ✅ Starts FastAPI server with hot reload (port 8000)
- ✅ Auto-generates OpenAPI schema at `/api/v1/openapi.json`
- ✅ Reloads when Python files change

#### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

**What it does:**

- ✅ Runs `npm run sync:openapi` automatically to copy the schema
- ✅ Regenerates TypeScript types when the spec changes
- ✅ Starts Next.js dev server (port 3000)

**You'll see 3 processes:**

```
[WATCHER] 👀 Backend Schema Watcher
[ORVAL]   🎉 orval watching...
[NEXT]    ▲ Next.js ready on http://localhost:3000
```

#### When You Make Changes

**Backend change:**

```
1. Edit backend/app/models/paper.py
2. [Backend] Uvicorn reloads (instant)
3. [WATCHER] Detects change, fetches schema (2-3 sec)
4. [ORVAL] Regenerates types (1-2 sec)
5. [TypeScript] Shows errors if API changed
6. Fix frontend code → Done! ✅
```

**Frontend change:**

```
1. Edit frontend/src/app/page.tsx
2. [NEXT] Hot reloads (instant)
3. Done! ✅
```

---

### Option 2: Backend-Only Development

Work on backend without running frontend.

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**What happens:**

- ✅ Backend runs normally
- ✅ OpenAPI schema available at `http://localhost:8000/api/v1/openapi.json`
- ✅ Frontend can sync later when they pull your changes

**When frontend starts later:**

```bash
cd frontend
npm run dev
# Orval reads the latest openapi.json and generates types automatically
```

---

### Option 3: Frontend-Only Development

Work on UI without running backend (useful for styling, components).

```bash
cd frontend
npm run dev
```

**What happens:**

- ✅ Uses existing `backend/openapi.json` for types
- ✅ Next.js runs and hot reloads
- ✅ Type checking works perfectly
- ⚠️ API calls will fail (no backend running)

**Solutions for API calls:**

- Use mock data in components
- Connect to staging/production backend
- Focus on UI components that don't need data

---

### Option 4: Teams Working Separately

Backend and frontend teams work independently, sync via Git.

```
Backend Team                    Frontend Team
┌──────────────────┐           ┌──────────────────┐
│ Edit models      │           │ Build UI         │
│ Test endpoints   │           │ Use mock data    │
│ Run backend      │           │ Run frontend     │
│                  │           │                  │
│ Commit:          │  ──────>  │ Pull:            │
│ • Python code    │           │ • backend/openapi.json
│ • openapi.json   │           │                  │
└──────────────────┘           │ npm run dev      │
                               │ → Types update!  │
                               └──────────────────┘
```

**Key:** `backend/openapi.json` is committed to Git as the "contract" between teams.

---

## Commands Reference

### Backend Commands

```bash
# Start backend server (pure Python, no Node.js!)
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Check if server is running
curl http://localhost:8000/api/v1/openapi.json

# Run migrations
alembic upgrade head

# Create migration
alembic revision --autogenerate -m "description"
```

### Frontend Commands

```bash
cd frontend

# 🌟 MAIN: Start development (watches backend, auto-generates types, starts Next.js)
npm run dev

# Manual: Generate types once
npm run generate:api

# Manual: Watch and regenerate types
npm run generate:api:watch

# Sync schema without regeneration
npm run sync:openapi

# Just Next.js (no auto-generation)
npm run dev:next-only

# Build for production
npm run build

# Start production server
npm start
```

### Manual Schema Export (if needed)

```bash
# From project root
curl http://localhost:8000/api/v1/openapi.json > backend/openapi.json

# Then regenerate frontend
cd frontend && npm run generate:api
```

---

## Using Generated API Hooks

### Import Patterns

```typescript
// Import hooks
import {
  useSearchPapers,
  useGetPaper,
  useGenerateReview,
  useSaveReview,
  useGetTaskStatus,
  useCancelTask,
  useUploadPaper,
} from "@/lib/api/generated";

// Import types
import type {
  Paper,
  ReviewRequest,
  TaskResponse,
  TaskStatus,
} from "@/lib/api/generated";
```

### Queries (GET Requests)

#### Simple Query

```typescript
function PaperList() {
  const { data, isLoading, error } = useSearchPapers({
    query: "machine learning",
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.map((paper) => (
        <div key={paper.id}>{paper.title}</div>
      ))}
    </div>
  );
}
```

#### Query with Options

```typescript
function PaperDetails({ paperId }: { paperId: string }) {
  const { data } = useGetPaper(paperId, {
    query: {
      enabled: !!paperId, // Only run if paperId exists
      staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
      retry: 3, // Retry failed requests 3 times
    },
  });

  return <div>{data?.title}</div>;
}
```

#### Query with Polling

```typescript
function TaskStatus({ taskId }: { taskId: string }) {
  const { data } = useGetTaskStatus(taskId, {
    query: {
      enabled: !!taskId,
      // Poll every 2 seconds while task is running
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status === "running" || status === "pending" ? 2000 : false;
      },
    },
  });

  return <div>Status: {data?.status}</div>;
}
```

### Mutations (POST/PUT/DELETE Requests)

#### Simple Mutation

```typescript
function GenerateButton() {
  const { mutate, isPending } = useGenerateReview();

  const handleClick = () => {
    mutate({
      data: {
        paper_ids: ["id1", "id2"],
        topic: "AI Research",
        max_papers: 10,
      },
    });
  };

  return (
    <button onClick={handleClick} disabled={isPending}>
      {isPending ? "Generating..." : "Generate Review"}
    </button>
  );
}
```

#### Mutation with Callbacks

```typescript
function SaveReviewButton({ review }: { review: Review }) {
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useSaveReview({
    mutation: {
      onSuccess: (data) => {
        console.log("Saved:", data.review_id);

        // Invalidate queries to refetch fresh data
        queryClient.invalidateQueries({
          queryKey: ["/api/v1/review/history"],
        });

        // Show success toast
        toast.success("Review saved!");
      },
      onError: (error) => {
        console.error("Failed:", error.message);
        toast.error("Failed to save review");
      },
    },
  });

  return (
    <button onClick={() => mutate({ data: review })} disabled={isPending}>
      {isPending ? "Saving..." : "Save Review"}
    </button>
  );
}
```

### Available Hooks

#### Papers

- `useSearchPapers({ query })` - Search papers by query
- `useGetPaper(paperId)` - Get single paper details
- `useChatWithPaper()` - Chat with a paper
- `useUploadPaper()` - Upload PDF file

#### Reviews

- `useGenerateReview()` - Start review generation (creates task)
- `useSaveReview()` - Save review to database
- `useGetReviewHistory()` - Get user's review history
- `useGetReview(reviewId)` - Get specific review
- `useDeleteReview()` - Delete a review

#### Tasks

- `useGetTaskStatus(taskId)` - Get task status (for polling)
- `useGetUserTasks()` - List user's tasks
- `useCancelTask()` - Cancel a running task

#### Documents

- `useGenerateDocument()` - Generate downloadable document from review

### Query Invalidation

Invalidate queries to refetch fresh data after mutations:

```typescript
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

// Invalidate all papers queries
queryClient.invalidateQueries({
  queryKey: ["/api/v1/papers/search"],
});

// Invalidate specific review
queryClient.invalidateQueries({
  queryKey: [`/api/v1/review/${reviewId}`],
});

// Invalidate all tasks
queryClient.invalidateQueries({
  queryKey: ["/api/v1/tasks/"],
});
```

### Loading & Error States

```typescript
const {
  data, // Response data
  isLoading, // Initial loading
  isFetching, // Refetching
  isError, // Error occurred
  error, // Error object
  isSuccess, // Successful
  refetch, // Manual refetch
} = useSearchPapers({ query: "AI" });

// For mutations
const {
  mutate, // Trigger mutation
  isPending, // Mutation in progress
  isError, // Mutation failed
  isSuccess, // Mutation succeeded
  data, // Mutation result
  error, // Error object
  reset, // Reset mutation state
} = useGenerateReview();
```

### Type Safety Examples

```typescript
// ✅ Valid - TypeScript validates structure
mutate({
  data: {
    paper_ids: ["123"],
    topic: "AI",
    max_papers: 10,
  },
});

// ❌ TypeScript Error - wrong field name
mutate({
  data: {
    paperIds: ["123"], // Should be paper_ids
    topic: "AI",
  },
});

// ✅ Response types are automatic
const { data } = useSearchPapers({ query: "AI" });
// data is typed as Paper[] | undefined

data?.forEach((paper) => {
  console.log(paper.title); // ✅ Valid
  console.log(paper.authors); // ✅ Valid
  console.log(paper.invalidProp); // ❌ TypeScript error!
});
```

### Authentication

Authentication is **automatic** - no need to manage tokens:

```typescript
// Just use the hooks - auth is handled automatically
const { data } = useSearchPapers({ query: "AI" });

// Behind the scenes:
// 1. Clerk provides authentication token
// 2. Custom Axios instance adds: Authorization: Bearer <token>
// 3. FastAPI validates token
// 4. Response returned
```

---

## Best Practices

### For Backend Developers

✅ **DO:**

- Always use Pydantic models for request/response types
- Add descriptions to models and endpoints (shows in autocomplete!)
- Commit `backend/openapi.json` with your changes
- Run backend with `--reload` during development
- Test endpoints with Swagger UI (`http://localhost:8000/docs`)

❌ **DON'T:**

- Don't manually edit `backend/openapi.json`
- Don't skip Pydantic validation
- Don't forget to export schema after major changes

### For Frontend Developers

✅ **DO:**

- Import types and hooks from `@/lib/api/generated`
- Trust the generated types
- Fix TypeScript errors after pulling backend changes
- Use query invalidation after mutations
- Add loading and error states to components

❌ **DON'T:**

- Don't edit files in `src/lib/api/generated/`
- Don't create manual type definitions for API data
- Don't ignore TypeScript errors (they show real API mismatches!)
- Don't commit `frontend/src/lib/api/generated/` to Git (it's in .gitignore)

### For Both Teams

✅ **DO:**

- Pull latest code before starting work
- Run your dev commands (`npm run dev` or `python -m uvicorn...`)
- Communicate breaking changes
- Read TypeScript errors - they're helpful!

❌ **DON'T:**

- Don't bypass the type system
- Don't use `any` types
- Don't skip regeneration after backend changes

---

## Troubleshooting

### Types Don't Match Runtime Data

**Symptoms:**

- Backend returns data but frontend type doesn't match
- Getting TypeScript errors on valid data

**Solution:**

```bash
cd frontend
npm run generate:api
```

Backend may have changed. Regenerating fixes it.

---

### Generated Code Not Updating

**Symptoms:**

- Edit backend model
- Frontend types don't change

**Check:**

1. Is backend running? (`python -m uvicorn app.main:app --reload`)
2. Did `backend/openapi.json` update? (Check file timestamp)
3. Is frontend `npm run dev` running?
4. Any errors in `[WATCHER]` or `[ORVAL]` logs?

**Manual fix:**

```bash
# Manually fetch schema
curl http://localhost:8000/api/v1/openapi.json > backend/openapi.json

# Manually regenerate
cd frontend && npm run generate:api
```

---

### TypeScript Errors After Backend Change

**This is expected and good!** ✅

**What it means:**

- Backend changed the API
- Types accurately reflect the new API
- Your code needs updating to match

**What to do:**

1. Read the error message carefully
2. Update your frontend code to match new API
3. Next.js will hot reload
4. Done!

**Example:**

```
Error: Property 'abstract' is missing in type 'Paper'

// Backend added 'abstract' field
// You need to handle it in frontend:

<div>
  <h1>{paper.title}</h1>
  <p>{paper.abstract}</p>  {/* Add this line */}
</div>
```

---

### API Calls Fail (Network Error)

**Symptoms:**

- Hooks return errors
- Network tab shows failed requests

**Check:**

1. Is backend running? (`http://localhost:8000/docs`)
2. Is frontend calling correct URL? (Check `.env.local`)
3. Are you authenticated? (Check Clerk session)
4. CORS issues? (Check backend CORS settings)

**Quick test:**

```bash
# Test backend directly
curl http://localhost:8000/api/v1/openapi.json

# Should return JSON, not error
```

---

### Orval Generation Fails

**Symptoms:**

```
[ORVAL] ✘ [ERROR] Failed to parse provided mutator function
```

**Common causes:**

1. Syntax error in `frontend/src/lib/api/axios-instance.ts`
2. TypeScript target too old (`tsconfig.json`)
3. Invalid OpenAPI schema

**Solution:**

```bash
# Check tsconfig.json has:
{
  "compilerOptions": {
    "target": "es2017"  // Not "es5"!
  }
}

# Validate OpenAPI schema
npx @apidevtools/swagger-cli validate backend/openapi.json
```

---

### Authentication Not Working

**Symptoms:**

- API returns 401 Unauthorized
- Token not being sent

**Check:**

1. `QueryProvider` setup in `frontend/src/lib/query-provider.tsx`:

```typescript
useEffect(() => {
  setTokenGetter(getToken); // Must be called!
}, [getToken]);
```

2. User is signed in via Clerk
3. Clerk environment variables are correct

---

### Merge Conflicts in openapi.json

**Scenario:**

- Pull latest code
- Merge conflict in `backend/openapi.json`

**Solution:**

```bash
# Accept their version (backend is source of truth)
git checkout --theirs backend/openapi.json

# Regenerate frontend types
cd frontend && npm run generate:api

# Fix any new TypeScript errors
# Commit your fixes
```

---

### Hook Not Found

**Symptoms:**

```
Module not found: Can't resolve '@/lib/api/generated'
```

**Solution:**

```bash
# Generate the API client first!
cd frontend
npm run generate:api
```

The `generated/` folder doesn't exist until you run generation.

---

## Quick Reference

| Task                    | Command                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------- |
| Start backend           | `cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` |
| Start frontend          | `cd frontend && npm run dev`                                                       |
| Generate types manually | `cd frontend && npm run generate:api`                                              |
| Export schema manually  | `curl http://localhost:8000/api/v1/openapi.json > backend/openapi.json`            |
| View API docs           | `http://localhost:8000/docs`                                                       |
| Test backend            | `curl http://localhost:8000/api/v1/openapi.json`                                   |

---

## Summary

### The Magic Formula

```
Backend Pydantic Models
        ↓
FastAPI OpenAPI Schema
        ↓
backend/openapi.json (committed to Git)
        ↓
Orval Code Generator
        ↓
Frontend TypeScript Types + TanStack Query Hooks
        ↓
Fully Type-Safe React Components
```

### Key Takeaways

1. ✅ **backend/openapi.json is the bridge** - Backend writes it, frontend reads it
2. ✅ **Everything is automatic** - Just run `npm run dev` and `python -m uvicorn...`
3. ✅ **TypeScript errors are your friend** - They show real API mismatches
4. ✅ **Never edit generated code** - Always regenerate instead
5. ✅ **Commit openapi.json** - It's the contract between teams

### Time Savings

**Manual approach:** 30-60 minutes per API change (write types, update hooks, test)  
**Automated approach:** 3-5 seconds per API change (automatic!)

**Over 100 API changes:** **~50-100 hours saved** 🎉

---

**You're all set!** Start both backend and frontend, make a change to a backend model, and watch the magic happen in 3-5 seconds! ✨
