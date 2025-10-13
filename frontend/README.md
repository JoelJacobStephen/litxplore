# 🔶 Frontend Development Guide

## 🚀 Quick Start

```bash
cd frontend
npm install  # If you haven't already
npm run dev
```

This **single command** starts:

1. ✅ Orval watcher (auto-regenerates types when backend schema changes)
2. ✅ Next.js dev server with hot reload

---

## 📊 What You'll See

```
[ORVAL] 🎉 orval watching...
[NEXT]  ▲ Next.js ready on http://localhost:3000
```

### When backend schema changes:

```
[ORVAL] 🎉 orval generated successfully
[ORVAL] ✨ Generated src/lib/api/generated/models/index.ts
[ORVAL] ✨ Generated src/lib/api/generated/papers.ts
[ORVAL] ✨ Generated src/lib/api/generated/review.ts
[NEXT]  Compiled successfully!
```

---

## 🔄 How It Works

```
Backend changes (in ../backend/)
          ↓
Backend exports openapi.json
          ↓
Orval detects ../backend/openapi.json change
          ↓ (~1 second)
Regenerates src/lib/api/generated/*
          ↓ (instantly)
TypeScript recompiles
          ↓ (instantly)
Shows errors if API changed
          ↓
You fix errors → Next.js hot reloads → Done! ✅
```

**Total frontend processing time: ~1-2 seconds!**

---

## 📦 Available Scripts

```bash
# 🌟 RECOMMENDED: Dev with auto type generation
npm run dev

# Just Next.js (no auto type generation)
npm run dev:next-only

# Manually generate types once
npm run generate:api

# Watch schema and regenerate types (without Next.js)
npm run generate:api:watch

# Production build
npm run build

# Start production server
npm run start
```

---

## 🎯 Development Workflow

### Daily Development

```bash
# Terminal 1 (Backend) - if not already running
cd backend
npm run dev

# Terminal 2 (Frontend)
cd frontend
npm run dev
```

### Using Generated Types

All API hooks are auto-generated in `src/lib/api/generated/`:

```typescript
// Import generated hooks
import {
  useSearchPapers,
  useGenerateReview,
  useGetTaskStatus,
} from "@/lib/api/generated";

export default function MyPage() {
  // Fully type-safe!
  const {
    data: papers,
    isLoading,
    error,
  } = useSearchPapers({
    query: "machine learning",
  });

  const generateReview = useGenerateReview();

  const handleGenerate = () => {
    generateReview.mutate({
      data: {
        paper_ids: ["123", "456"],
        prompt: "Compare these papers",
      },
    });
  };

  return <div>...</div>;
}
```

### When Backend API Changes

**Scenario:** Backend adds new field to `Paper` model

**1. Backend dev makes change:**

```python
# backend/app/models/paper.py
class Paper(BaseModel):
    id: str
    title: str
    doi: Optional[str] = None  # ← NEW FIELD
```

**2. You see in your terminal (~2-3 seconds later):**

```
[ORVAL] 🎉 orval generated successfully
```

**3. TypeScript immediately shows errors:**

```typescript
// ❌ Property 'doi' is missing in type...
const paper: Paper = {
  id: "123",
  title: "Research",
  // TypeScript error! 'doi' is now in the type
};
```

**4. You fix the code:**

```typescript
const paper: Paper = {
  id: "123",
  title: "Research",
  doi: "10.1234/example", // ✅ Added
};
```

**5. Next.js hot reloads** → Done! ✅

---

## 📁 File Structure

```
frontend/
├── src/
│   ├── lib/api/
│   │   ├── generated/         # Auto-generated (don't edit!)
│   │   │   ├── index.ts       # All exports
│   │   │   ├── models/        # TypeScript types
│   │   │   ├── papers.ts      # Paper API hooks
│   │   │   ├── review.ts      # Review API hooks
│   │   │   ├── tasks.ts       # Task API hooks
│   │   │   └── documents.ts   # Document API hooks
│   │   ├── axios-instance.ts  # Custom Axios with Clerk auth
│   │   └── README.md
│   ├── app/                   # Next.js pages
│   └── components/            # React components
├── orval.config.js            # Orval configuration
└── package.json
```

---

## 🔧 Configuration

### Orval Config (`orval.config.js`)

```javascript
export default defineConfig({
  litxplore: {
    input: {
      target: "../backend/openapi.json", // ← Source of truth
    },
    output: {
      mode: "tags-split",
      target: "./src/lib/api/generated/api.ts",
      schemas: "./src/lib/api/generated/models",
      client: "react-query",
      override: {
        mutator: {
          path: "./src/lib/api/axios-instance.ts",
          name: "customInstance", // Uses Clerk auth
        },
      },
    },
  },
});
```

### Backend URL

The Axios instance uses environment variables:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🐛 Troubleshooting

### Types don't update

**Cause:** Orval not watching or backend schema not updating  
**Solution:**

```bash
# Check if backend is running and updating schema
cd ../backend && ls -l openapi.json

# Manually regenerate
npm run generate:api

# Restart dev server
npm run dev
```

### TypeScript errors after backend change

**This is expected!** 🎉

TypeScript errors after schema changes are **good** - they show you exactly what needs to be updated.

**Solution:** Fix the errors. The types are now accurate to the backend!

### "Cannot find module '@/lib/api/generated'"

**Cause:** Types not generated yet  
**Solution:**

```bash
# Generate types
npm run generate:api

# Make sure backend/openapi.json exists
ls -l ../backend/openapi.json
```

### Axios authentication not working

**Cause:** Clerk not initialized or token getter not set  
**Solution:** Check `src/lib/query-provider.tsx`:

```typescript
import { setTokenGetter } from "./api/axios-instance";

export function QueryProvider({ children }) {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(getToken); // ← This must run
  }, [getToken]);

  // ...
}
```

---

## 🎓 Key Concepts

### Generated vs Manual Code

| Type             | Location                        | Can Edit?                |
| ---------------- | ------------------------------- | ------------------------ |
| **Generated**    | `src/lib/api/generated/*`       | ❌ No (gets overwritten) |
| **Custom Axios** | `src/lib/api/axios-instance.ts` | ✅ Yes                   |
| **Components**   | `src/app/*`, `src/components/*` | ✅ Yes                   |
| **Manual hooks** | Anywhere else                   | ✅ Yes                   |

### Type Safety Flow

```
Backend Pydantic Model
        ↓
OpenAPI Schema (openapi.json)
        ↓
Orval Generation
        ↓
TypeScript Types & Hooks
        ↓
Your Components (type-safe!)
```

### Authentication Flow

```
1. User action in component
2. Generated hook called
3. Custom Axios instance used
4. Axios interceptor adds Clerk token
5. Request sent to backend
6. Response returned (type-safe!)
```

---

## ✅ Best Practices

### ✅ Do:

- Use `npm run dev` for daily development
- Import from `@/lib/api/generated`
- Trust TypeScript errors after backend changes
- Use generated types for all API interactions

### ❌ Don't:

- Edit files in `src/lib/api/generated/*` (gets overwritten)
- Manually type API responses (use generated types)
- Ignore TypeScript errors after backend updates

---

## 📚 Generated Hooks Reference

### Queries (GET requests)

```typescript
import { useSearchPapers, useGetTaskStatus } from "@/lib/api/generated";

// Basic usage
const { data, isLoading, error } = useSearchPapers({
  query: "AI",
});

// With options
const { data } = useGetTaskStatus(
  { taskId: "123" },
  {
    refetchInterval: 2000, // Poll every 2 seconds
    enabled: !!taskId, // Only run if taskId exists
  }
);
```

### Mutations (POST/PUT/DELETE)

```typescript
import { useGenerateReview, useCreateDocument } from "@/lib/api/generated";

const generateReview = useGenerateReview();

const handleSubmit = () => {
  generateReview.mutate(
    {
      data: {
        paper_ids: ["1", "2"],
        prompt: "Compare these",
      },
    },
    {
      onSuccess: (data) => {
        console.log("Review created:", data);
      },
      onError: (error) => {
        console.error("Error:", error);
      },
    }
  );
};
```

### Advanced: Query Invalidation

```typescript
import { useQueryClient } from "@tanstack/react-query";
import { useGenerateReview } from "@/lib/api/generated";

const queryClient = useQueryClient();
const generateReview = useGenerateReview();

const handleGenerate = () => {
  generateReview.mutate(
    {
      data: {
        /* ... */
      },
    },
    {
      onSuccess: () => {
        // Invalidate related queries
        queryClient.invalidateQueries(["reviews"]);
      },
    }
  );
};
```

---

## 🔗 Integration with Backend

### The Connection

```
Frontend (this folder)         Backend (../backend)
├── Watches ../backend/        ├── Exports schema
│   openapi.json               │   to openapi.json
├── Orval detects change       ├── When Python files
├── Regenerates types ←─────── │   change
├── TypeScript recompiles      └── (see backend/README.md)
└── Next.js hot reloads!
```

### Standalone Frontend Development

You can work on frontend **without running backend**:

- Use generated types from last schema export
- Backend doesn't need to be running for UI work
- Perfect for frontend-only teams
- Just make sure `../backend/openapi.json` exists

---

## 🎉 Summary

**One command:** `npm run dev`

**What it does:**

- ✅ Watches backend schema for changes
- ✅ Auto-regenerates TypeScript types
- ✅ Starts Next.js with hot reload
- ✅ Gives instant TypeScript feedback

**You focus on:** Writing React/TypeScript code

**Everything else:** Automated! 🚀

---

## 📞 Support

**Questions?** Check these docs:

- `../API_TYPE_SYNC_GUIDE.md` - Complete API type synchronization guide
- `../QUICKSTART.md` - Project quick start
- `../backend/README.md` - Backend setup
- `../DOCUMENTATION_GUIDE.md` - Documentation overview

**Happy frontend coding!** ⚛️
