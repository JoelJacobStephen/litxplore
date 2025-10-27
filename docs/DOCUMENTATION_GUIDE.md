# 📚 Documentation Guide

## Essential Documentation Files

This guide explains the purpose of each documentation file in this repository.

---

## 📖 Root Level Documentation

### Main Documentation (Read These First!)

| File                       | Purpose                                     | When to Read                                    |
| -------------------------- | ------------------------------------------- | ----------------------------------------------- |
| **README.md**              | Project overview, quick start, architecture | First time setup, general reference             |
| **QUICKSTART.md**          | 60-second getting started guide             | When you want to start development quickly      |
| **API_TYPE_SYNC_GUIDE.md** | Complete guide to API type synchronization  | Understanding how backend/frontend stay in sync |

### Deployment & Setup

| File                 | Purpose                        |
| -------------------- | ------------------------------ |
| **SIMPLE_DEPLOY.md** | Simple deployment instructions |
| **setup-vps.sh**     | VPS setup script               |
| **deploy.sh**        | Deployment script              |

---

## 🔷 Backend Documentation

### Location: `backend/`

| File                 | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| **README.md**        | Backend development guide - Pure Python, no Node.js! |
| **requirements.txt** | Python dependencies                                  |
| **openapi.json**     | Auto-generated OpenAPI schema (commit this!)         |

### Important Notes:

- ✅ **`openapi.json` should be committed** - It's the source of truth for frontend type generation
- ✅ **Backend is pure Python** - No Node.js dependencies or scripts
- ✅ Run with: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

---

## 🔶 Frontend Documentation

### Location: `frontend/`

| File                | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| **README.md**       | Frontend development guide, explains automation |
| **orval.config.js** | Orval configuration for type generation         |
| **package.json**    | Node.js dependencies and scripts                |

### Scripts Directory: `frontend/scripts/`

| File                 | Purpose                                                    |
| -------------------- | ---------------------------------------------------------- |
| **watch-backend.js** | Watches backend Python files, fetches schema automatically |

### Important Notes:

- ✅ **Frontend watches backend** - Automatically fetches schema when backend changes
- ✅ **Generated code is gitignored** - Run `npm run generate:api` to regenerate
- ✅ Run with: `npm run dev` (starts watcher + Orval + Next.js)

---

## 📁 Docs Folder

### Location: `docs/`

Contains implementation guides and reviews:

- `auth-implementation-review.md`
- `auto-deployment-setup.md`
- `backend-implementation-guide.md`
- `backend-implementation-review.md`
- `frontend-implementation-guide.md`
- `review-generation-flow.md`

These are historical/reference documents for understanding implementation details.

---

## 🗑️ What Was Removed (Cleanup)

The following files were removed as they were migration-specific or redundant:

### Removed Files:

**Phase 1 - Migration cleanup:**

- ❌ `BACKEND_PURE_PYTHON.md` - Info now in `backend/README.md`
- ❌ `MIGRATION_COMPLETE.md` - Migration-specific
- ❌ `ORVAL_IMPLEMENTATION_SUMMARY.md` - Redundant summary
- ❌ `SETUP_COMPLETE.md` - Redundant with other docs
- ❌ `frontend/MIGRATION_GUIDE.md` - Migration-specific
- ❌ `frontend/orval.config.ts` - Duplicate (using `.js` version)
- ❌ `backend/export_schema.py` - Problematic, not needed
- ❌ `backend/package-lock.json` - Leftover from Node.js cleanup

**Phase 2 - Documentation consolidation:**

- ❌ `ORVAL_QUICK_REFERENCE.md` - Consolidated into `API_TYPE_SYNC_GUIDE.md`
- ❌ `SEPARATED_WORKFLOW.md` - Consolidated into `API_TYPE_SYNC_GUIDE.md`
- ❌ `TYPE_SAFE_API_SETUP.md` - Consolidated into `API_TYPE_SYNC_GUIDE.md`
- ❌ `frontend/ORVAL_QUICK_REFERENCE.md` - Consolidated into `API_TYPE_SYNC_GUIDE.md`
- ❌ `frontend/src/lib/api/README.md` - Consolidated into `API_TYPE_SYNC_GUIDE.md`

---

## 🎯 Quick Reference: Which Doc to Read?

### "I'm new to the project"

→ Read: `QUICKSTART.md` then `README.md`

### "How do I develop the backend?"

→ Read: `backend/README.md`

### "How do I develop the frontend?"

→ Read: `frontend/README.md`

### "How does type generation work?"

→ Read: `API_TYPE_SYNC_GUIDE.md`

### "How do backend and frontend work together?"

→ Read: `API_TYPE_SYNC_GUIDE.md` (Development Workflows section)

### "How do I use the generated API hooks?"

→ Read: `API_TYPE_SYNC_GUIDE.md` (Using Generated API Hooks section)

### "I'm getting errors, help!"

→ Read: `API_TYPE_SYNC_GUIDE.md` (Troubleshooting section)

---

## 📝 What NOT to Edit

### Auto-Generated Files (Don't Edit!)

```
frontend/src/lib/api/generated/     ← Auto-generated by Orval
backend/openapi.json                ← Auto-generated by backend watcher
```

These files are auto-generated. If you need to change them:

- **For generated API code**: Change the backend models, schema regenerates automatically
- **For openapi.json**: It updates automatically when backend changes

---

## ✅ What to Commit to Git

### Always Commit:

- ✅ `backend/openapi.json` - Source of truth for types
- ✅ All documentation `.md` files
- ✅ `frontend/orval.config.js` - Type generation config
- ✅ `frontend/scripts/watch-backend.js` - Automation script

### Never Commit (in `.gitignore`):

- ❌ `frontend/src/lib/api/generated/` - Auto-generated
- ❌ `node_modules/` - Install with `npm install`
- ❌ `__pycache__/` - Python cache
- ❌ `.env` files - Contains secrets

---

## 🔄 Keeping Documentation Updated

### When to Update Docs:

| You Changed...        | Update These Docs...                                                      |
| --------------------- | ------------------------------------------------------------------------- |
| Backend API endpoints | `backend/openapi.json` (auto), `API_TYPE_SYNC_GUIDE.md` (if new patterns) |
| Frontend automation   | `frontend/README.md`, `API_TYPE_SYNC_GUIDE.md`                            |
| Backend setup         | `backend/README.md`                                                       |
| Deployment process    | `SIMPLE_DEPLOY.md`, `README.md`                                           |
| Quick start steps     | `QUICKSTART.md`                                                           |

---

## 📞 Help & Support

**Can't find what you're looking for?**

1. Check the **Quick Reference** section above
2. Search all `.md` files for keywords
3. Check the `docs/` folder for historical context
4. Ask your team!

---

**Keep docs up to date!** 📝✨
