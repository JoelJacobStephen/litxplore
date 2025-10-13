# ⚡ Quick Start Guide

## 🎯 Get Running in 60 Seconds

### Step 1: Backend (Terminal 1)

```bash
cd /Users/joeljacobstephen/Coding-Workspace/projects/litxplore/backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**You'll see:**

```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Step 2: Frontend (Terminal 2)

```bash
cd /Users/joeljacobstephen/Coding-Workspace/projects/litxplore/frontend
npm run dev
```

**You'll see:**

```
[WATCHER] 👀 Backend Schema Watcher (from frontend)
[WATCHER] ✅ OpenAPI schema updated successfully!
[ORVAL]   🎉 orval watching...
[NEXT]    ▲ Next.js ready on http://localhost:3000
```

### Step 3: Open Browser

```
http://localhost:3000
```

**That's it!** 🎉

---

## 🎨 Make Your First Change

### Edit Backend (Terminal 1's folder)

Open `backend/app/models/paper.py` and add a field:

```python
class Paper(BaseModel):
    id: str
    title: str
    authors: List[str]
    summary: str
    test_field: str = "test"  # ← Add this
```

**Save the file.**

### Watch the Magic ✨

**Terminal 1 (Backend):**

```
INFO:     Detected file change, reloading...
```

**Terminal 2 (Frontend):**

```
[WATCHER] 🔄 Backend file changed: backend/app/models/paper.py
[WATCHER] ⏳ Fetching OpenAPI schema from backend...
[WATCHER] ✅ OpenAPI schema updated successfully!
[ORVAL]   🎉 orval generated successfully
```

**Your editor:**
TypeScript now shows errors where `test_field` is missing!

### Fix and Done!

Add the field where TypeScript complains, and Next.js hot reloads automatically.

**Total time: ~5 seconds!** ⚡

---

## 🎯 What's Running?

| Terminal       | Service               | URL                   | Auto-Syncs                                 |
| -------------- | --------------------- | --------------------- | ------------------------------------------ |
| **Terminal 1** | FastAPI (Pure Python) | http://localhost:8000 | Hot reloads on Python changes              |
| **Terminal 2** | Frontend + Watcher    | http://localhost:3000 | Watches backend, fetches schema, gen types |

---

## 📖 Next Steps

### Learn More

1. **Backend Guide:** `backend/README.md`
2. **Frontend Guide:** `frontend/README.md`
3. **API Reference:** `frontend/ORVAL_QUICK_REFERENCE.md`
4. **Project Overview:** `README.md`

### Explore Generated Hooks

```typescript
// frontend/src/app/mypage/page.tsx
import { useSearchPapers } from "@/lib/api/generated";

export default function MyPage() {
  // Fully type-safe!
  const { data: papers } = useSearchPapers({
    query: "AI research",
  });

  return <div>...</div>;
}
```

### Add a New API Endpoint

**Backend:**

```python
# backend/app/api/v1/endpoints/papers.py
@router.get("/new-endpoint")
async def new_endpoint():
    return {"message": "Hello"}
```

**Wait 5 seconds** → Frontend has the new hook automatically!

```typescript
import { useNewEndpoint } from "@/lib/api/generated";
```

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check Python
python --version  # or python3 --version

# Install Python dependencies
cd backend
pip install -r requirements.txt
```

### Frontend won't start

```bash
# Install dependencies
cd frontend
npm install
```

### Types don't update

```bash
# Check backend/openapi.json exists
ls -l backend/openapi.json

# Manually regenerate
cd frontend && npm run generate:api
```

### Need to run separately?

**Just backend:**

```bash
cd backend && npm run dev
```

**Just frontend:**

```bash
cd frontend && npm run dev
```

They work independently! Backend will still export schema, frontend will use last exported schema.

---

## 🎊 You're All Set!

### What You Have

✅ **Backend auto-exports** schema on every Python change  
✅ **Frontend auto-generates** types on every schema change  
✅ **TypeScript catches** all API mismatches  
✅ **3-5 second** sync time  
✅ **Independent** backend and frontend workflows

### What To Do

1. Edit backend Python files
2. Edit frontend TypeScript files
3. Everything syncs automatically!

**No manual commands needed!** 🚀

---

## 📞 Quick Reference

| Task                 | Command                                                                            |
| -------------------- | ---------------------------------------------------------------------------------- |
| Start backend        | `cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` |
| Start frontend       | `cd frontend && npm run dev`                                                       |
| Stop either          | `Ctrl+C`                                                                           |
| Manual schema export | `curl http://localhost:8000/api/v1/openapi.json > backend/openapi.json`            |
| Manual type gen      | `cd frontend && npm run generate:api`                                              |

---

**Happy coding!** 🎈

For detailed guides, see:

- `README.md` - Project overview
- `API_TYPE_SYNC_GUIDE.md` - How type syncing works
- `backend/README.md` - Backend development
- `frontend/README.md` - Frontend development
