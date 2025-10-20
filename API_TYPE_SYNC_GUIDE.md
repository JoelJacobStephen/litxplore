# 🔄 API Type Synchronization Guide

**Complete guide to understanding how LitXplore keeps backend and frontend perfectly in sync**

---

## 📖 Table of Contents

1. [What Is This System?](#what-is-this-system)
2. [How It Works (Simple Explanation)](#how-it-works-simple-explanation)
3. [Architecture Overview](#architecture-overview)
4. [Hook Naming with Operation IDs](#hook-naming-with-operation-ids)
5. [Development Workflows](#development-workflows)
6. [Commands Reference](#commands-reference)
7. [Using Generated API Hooks](#using-generated-api-hooks)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Recent Improvements (2025)

**✨ Automatic Index Generation in Watch Mode**

The type sync system now uses Orval's built-in `afterAllFilesWrite` hook to automatically generate the root `index.ts` barrel file after every code generation, including in watch mode during `npm run dev`. This eliminates the need for manual workarounds or custom wrapper scripts.

**Key benefits:**
- ✅ Works seamlessly in watch mode
- ✅ No manual intervention needed
- ✅ Stable imports: `import { useSearchPapers } from '@/lib/api/generated'`
- ✅ Runs in CI/CD builds automatically
- ✅ Simplified development workflow

**What changed:**
- Added `hooks.afterAllFilesWrite` to `orval.config.js`
- Simplified `package.json` scripts
- Removed need for wrapper scripts
- More reliable type synchronization

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
Orval Hook Runs (generates index.ts with all exports)
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

## Hook Naming with Operation IDs

### How It Works

LitXplore uses FastAPI's `operation_id` parameter to generate **clean, predictable hook names** automatically. No custom scripts needed!

**Backend (FastAPI):**

```python
@router.get("/search", response_model=List[Paper], operation_id="searchPapers")
async def search_papers(query: Optional[str] = None):
    # ...
```

**Frontend (Auto-generated):**

```typescript
import { useSearchPapers } from "@/lib/api/generated";

const { data } = useSearchPapers({ query: "AI" });
// Hook name comes directly from operation_id!
```

### Why This Approach?

**Before (problematic):**

- Orval generated verbose names: `useSearchPapersApiV1PapersSearchGet`
- Needed custom script to create aliases
- Easy to forget updating aliases when endpoints changed
- Build errors when aliases became outdated

**After (simplified):**

- Backend controls hook names via `operation_id`
- Orval uses those names directly
- Single source of truth (backend)
- Automatic consistency
- No manual maintenance needed

### The Flow

```
Backend Developer
       ↓
Adds operation_id="searchPapers" to @router.get()
       ↓
FastAPI generates OpenAPI schema with operationId
       ↓
Orval reads operationId from schema
       ↓
Generates useSearchPapers() hook automatically
       ↓
Frontend Developer imports and uses clean hook name ✅
```

### Adding a New Endpoint

**Step 1:** Add `operation_id` to your FastAPI route:

```python
@router.post("/analyze", response_model=AnalysisResult, operation_id="analyzeDocument")
async def analyze_document(doc: Document):
    # ...
```

**Step 2:** That's it! The hook is automatically available:

```typescript
import { useAnalyzeDocument } from "@/lib/api/generated";

const { mutate } = useAnalyzeDocument();
```

### Naming Convention

Use **camelCase** for operation_ids to match JavaScript conventions:

```python
# ✅ Good
operation_id="searchPapers"
operation_id="getPaper"
operation_id="chatWithPaper"
operation_id="generateReview"

# ❌ Avoid
operation_id="search_papers"  # snake_case
operation_id="SearchPapers"   # PascalCase
```

Orval automatically adds the `use` prefix for React hooks:

- `operation_id="searchPapers"` → `useSearchPapers()`
- `operation_id="getPaper"` → `useGetPaper()`

### Current Endpoints

Here are all the operation_ids currently defined:

**Papers:**

- `searchPapers` → `useSearchPapers()`
- `getPaper` → `useGetPaper()`
- `chatWithPaper` → `useChatWithPaper()`
- `uploadPaper` → `useUploadPaper()`

**Review:**

- `generateReview` → `useGenerateReview()`
- `saveReview` → `useSaveReview()`
- `getReviewHistory` → `useGetReviewHistory()`
- `deleteReview` → `useDeleteReview()`

**Tasks:**

- `getTaskStatus` → `useGetTaskStatus()`
- `getUserTasks` → `useGetUserTasks()`
- `cancelTask` → `useCancelTask()`

**Documents:**

- `generateDocument` → `useGenerateDocument()`

**Users:**

- `getCurrentUser` → `useGetCurrentUser()`

**History:**

- `clearHistory` → `useClearHistory()`

### The Generated Index File

A simple barrel file re-exports all modules:

```typescript
// frontend/src/lib/api/generated/index.ts
export * from "./models";
export * from "./papers/papers";
export * from "./review/review";
export * from "./tasks/tasks";
export * from "./documents/documents";
export * from "./users/users";
export * from "./history/history";
export * from "./default/default";
```

**Automation: Keeping `index.ts` Present with tags-split**

When Orval runs in `tags-split` mode, it cleans the output directory on each generation. Because `frontend/src/lib/api/generated/` is gitignored, the `index.ts` barrel file needs to be regenerated after every Orval run to ensure imports like `@/lib/api/generated` always work.

**Solution: Orval Hooks**

We use Orval's built-in `afterAllFilesWrite` hook to automatically run the index generator after every generation, including in watch mode:

**orval.config.js:**

```javascript
module.exports = {
  litxplore: {
    input: {
      target: "./openapi.json",
    },
    output: {
      mode: "tags-split",
      target: "./src/lib/api/generated",
      schemas: "./src/lib/api/generated/models",
      client: "react-query",
      clean: true,
      // ... other options
    },
    hooks: {
      afterAllFilesWrite: {
        command: 'node scripts/generate-api-index.js',
        injectGeneratedDirsAndFiles: false, // Don't pass file paths as args
      },
    },
  },
};
```

**Key Points:**
- `afterAllFilesWrite` runs after Orval generates files
- `injectGeneratedDirsAndFiles: false` prevents Orval from injecting file paths as command arguments
- Works in both one-off generation (`npm run generate:api`) and watch mode (`npm run dev`)

**Index Generator Script** (`frontend/scripts/generate-api-index.js`):

```javascript
const fs = require('fs');
const path = require('path');

const generatedDir = path.join(__dirname, '../src/lib/api/generated');
const indexPath = path.join(generatedDir, 'index.ts');

// List of subdirectories that orval generates
const subdirs = ['default', 'documents', 'history', 'papers', 'review', 'tasks', 'users'];

// Create the index file content
const indexContent = `// Auto-generated index file for orval generated API
// This file re-exports all generated API hooks and types
// Generated by scripts/generate-api-index.js

${subdirs.map(dir => `export * from './${dir}/${dir}';`).join('\n')}
export * from './models';
`;

// Write the index file
try {
  fs.writeFileSync(indexPath, indexContent, 'utf8');
  console.log('✅ Generated API index file at:', indexPath);
} catch (error) {
  console.error('❌ Failed to generate API index file:', error.message);
  process.exit(1);
}
```

**package.json scripts:**

```json
{
  "scripts": {
    "dev": "concurrently \"npm run watch:backend\" \"npm run generate:api:watch\" \"next dev\"",
    "generate:api": "npm run sync:openapi && orval --config ./orval.config.js && npm run postgenerate:api",
    "generate:api:watch": "orval --config ./orval.config.js --watch",
    "postgenerate:api": "node scripts/generate-api-index.js",
    "watch:backend": "node scripts/watch-backend.js"
  }
}
```

**How it works:**
1. Orval generates files
2. Hook runs `generate-api-index.js` automatically
3. `index.ts` is created with all exports
4. Imports work seamlessly: `import { useSearchPapers } from '@/lib/api/generated'`

**Benefits:**
- ✅ Works in watch mode (during `npm run dev`)
- ✅ Works in one-off generation
- ✅ Works in CI/CD builds
- ✅ No manual intervention needed
- ✅ Stable imports across the entire application

### Orval Configuration

The complete `orval.config.js` configuration:

```javascript
module.exports = {
  litxplore: {
    input: {
      target: "./openapi.json", // Local file, watched for changes
    },
    output: {
      mode: "tags-split",
      target: "./src/lib/api/generated",
      schemas: "./src/lib/api/generated/models",
      client: "react-query",
      mock: false,
      clean: true, // Clean output folder on each run
      tsconfig: "./tsconfig.json",
      indexFiles: {
        includeSchemasIndex: true, // Generate index files per tag directory
      },
      override: {
        operationName: (operation, route, verb) => {
          // Use operation_id from FastAPI for clean hook names
          return operation.operationId || operation.operationName;
        },
        mutator: {
          path: "./src/lib/api/axios-instance.ts",
          name: "customInstance", // Custom Axios instance with auth
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true, // AbortSignal support
        },
      },
    },
    hooks: {
      afterAllFilesWrite: {
        command: 'node scripts/generate-api-index.js',
        injectGeneratedDirsAndFiles: false, // Don't pass file paths as args
      },
    },
  },
};
```

**Key Configuration Points:**

- **`input.target`**: Points to local `openapi.json` file (copied from backend)
- **`mode: "tags-split"`**: Organizes generated files by OpenAPI tags (papers, review, tasks, etc.)
- **`clean: true`**: Ensures clean slate on each generation
- **`operationName` override**: Uses FastAPI's `operation_id` for clean hook names
- **`mutator`**: Uses custom Axios instance for authentication
- **`hooks.afterAllFilesWrite`**: Auto-generates root index.ts after every generation

### Integration with Type Sync System

```
Backend Change (add/modify operation_id)
       ↓
Uvicorn Reloads
       ↓
OpenAPI Schema Updates
       ↓
Backend Watcher Saves openapi.json
       ↓
Frontend Sync Copies Spec
       ↓
Orval Regenerates API Code with Clean Hook Names  ← AUTOMATIC
       ↓
TypeScript Types & Hooks Available
       ↓
Your Code Uses Clean Imports ✅
```

No custom scripts, no manual alias management, no sync issues!

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

**You'll see 3 concurrent processes:**

```
[WATCHER] 👀 Backend Schema Watcher
          Watches backend Python files, auto-fetches OpenAPI schema
          
[ORVAL]   🎉 Orval watching...
          Watches openapi.json, regenerates types on changes
          Runs index generator hook automatically
          
[NEXT]    ▲ Next.js ready on http://localhost:3000
          Hot reloads on frontend changes
```

#### When You Make Changes

**Backend change:**

```
1. Edit backend/app/models/paper.py
2. [Backend] Uvicorn reloads (instant)
3. [WATCHER] Detects change, fetches schema (2-3 sec)
4. [ORVAL] Regenerates types (1-2 sec)
5. [ORVAL HOOK] Generates index.ts automatically
6. [TypeScript] Shows errors if API changed
7. Fix frontend code → Done! ✅
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
- Add `operation_id` to all endpoints using camelCase naming
- Add descriptions to models and endpoints (shows in autocomplete!)
- Commit `backend/openapi.json` with your changes
- Run backend with `--reload` during development
- Test endpoints with Swagger UI (`http://localhost:8000/docs`)

❌ **DON'T:**

- Don't manually edit `backend/openapi.json`
- Don't skip Pydantic validation
- Don't forget to add `operation_id` when creating new endpoints
- Don't use snake_case or PascalCase for operation_ids (use camelCase)

### For Frontend Developers

✅ **DO:**

- Import types and hooks from `@/lib/api/generated`
- Trust the generated types
- Fix TypeScript errors after pulling backend changes
- Use query invalidation after mutations
- Add loading and error states to components

❌ **DON'T:**

- Don't edit files in `src/lib/api/generated/` (they get overwritten)
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

**Causes:**

1. API types haven't been generated yet
2. Orval's hook didn't run (index.ts file missing)

**Solutions:**

**Option 1: Generate types (first-time setup)**

```bash
cd frontend
npm run generate:api
```

The `generated/` folder and `index.ts` don't exist until you run generation.

**Option 2: Hook not executing in watch mode**

If the hook isn't running during `npm run dev`:

1. Check `orval.config.js` has the hook configured:
   ```javascript
   hooks: {
     afterAllFilesWrite: {
       command: 'node scripts/generate-api-index.js',
       injectGeneratedDirsAndFiles: false,
     },
   }
   ```

2. Manually run the index generator:
   ```bash
   node scripts/generate-api-index.js
   ```

3. Restart dev server:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

**Verify the fix:**

```bash
# Check if index.ts exists
ls -la src/lib/api/generated/index.ts

# Should show the file with recent timestamp
```

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
