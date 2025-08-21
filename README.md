# LitXplore

LitXplore is a research exploration platform that simplifies discovering and synthesizing academic literature. It allows users to find relevant research papers by entering a topic, uploading PDFs, or directly searching ArXiv through an integrated web interface. Once papers are selected, an advanced LLM-driven workflow powered by LangChain analyzes the content and generates a comprehensive literature review with accurate citations. Designed for researchers and academics, LitXplore streamlines the literature review process, saving time and enhancing research quality.

## Features

### 🔑 Key Features

- **Topic-Based Search:** Automatically retrieve relevant academic papers by entering a research topic.
- **Flexible Input Options:** Upload personal research papers in PDF format or search for papers directly from ArXiv.
- **LLM-Powered Review Generation:** Utilize advanced language models to synthesize and generate comprehensive literature reviews with accurate citations.
- **User-Friendly Web Interface:** A seamless and intuitive interface designed for efficient research and review compilation.

### 📚 How It Works

1. **Input Research Topic:** Enter a research topic to fetch relevant papers.
2. **Select Papers:** Choose from the retrieved papers, upload your own, or search directly on ArXiv.
3. **Generate Review:** The selected papers are analyzed using LangChain to generate a comprehensive literature review with precise citations.

### 👨‍💻 Technical Features

- 🔒 Authentication via Clerk
- 🚀 Real-time streaming responses
- 💾 Redis caching for performance
- ⚡ Rate limiting and error handling
- 🔄 Async/await architecture
- ✅ Input validation with Pydantic
- 📱 Responsive design

## Tech Stack

### Frontend

- Next.js 13+ with App Router
- TypeScript
- Tailwind CSS
- `shadcn/ui` components
- Zustand for state management
- React Query for data fetching
- Clerk for authentication

### Backend

- FastAPI
- PostgreSQL
- SQLAlchemy ORM
- Redis
- LangChain
- Google Vertex AI (Gemini Integration)
- Alembic for migrations

## Prerequisites

### Frontend

- Node.js 16+
- npm or yarn
- Clerk account

### Backend

- Python 3.9+
- PostgreSQL
- Redis server
- Google Cloud project with Vertex AI API enabled
- Google Cloud credentials

## Setup

### Backend Setup

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Configure environment variables:

```bash
cp .env.example .env
```

4. Update `.env` with your credentials (see backend/.env.example for required variables)

5. Run database migrations:

```bash
alembic upgrade head
```

6. Start the backend server:

```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env.local
```

3. Update environment variables with your API endpoints and Clerk credentials

4. Start the development server:

```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

<!-- ## License

MIT License - See LICENSE file for details -->

## Acknowledgments

- ArXiv API for paper access
- Google Vertex AI for language processing
- LangChain for AI orchestration
- All open-source contributors
