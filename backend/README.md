# Literature Review Generator Backend

FastAPI backend service that generates academic literature reviews using LangChain and Google's Vertex AI (Gemini).

## Features

- ArXiv paper retrieval and processing
- Semantic search with FAISS vector store
- Map-reduce summarization with constitutional AI
- Redis caching for frequent queries
- Rate limiting and error handling
- Async/await throughout
- Pydantic validation

## Prerequisites

- Python 3.9+
- Redis server
- Google Cloud project with Vertex AI API enabled
- Google Cloud credentials

## Setup

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy environment variables:

```bash
cp .env.example .env
```

4. Update `.env` with your configuration:

- Set your Google Cloud project ID
- Configure path to Google credentials
- Update Redis settings if needed
- Adjust rate limits and other parameters

## Running the Server

Development:

```bash
uvicorn app.main:app --reload --port 8000
```

Production:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### POST /api/v1/review/generate-review

Generate a literature review for a given topic.

Request body:

```json
{
  "topic": "Recent advances in transformer architectures",
  "max_papers": 10
}
```

Response:

```json
{
  "review": "Generated literature review text...",
  "citations": [
    {
      "id": "2307.12345",
      "title": "Paper Title",
      "authors": ["Author 1", "Author 2"],
      "published": "2023-07-01T00:00:00",
      "summary": "Paper summary...",
      "url": "https://arxiv.org/abs/2307.12345"
    }
  ]
}
```

## Error Handling

- 404: No relevant papers found
- 422: Invalid request parameters
- 429: Rate limit exceeded
- 503: ArXiv API unavailable
- 500: Unexpected server error

## Caching

Reviews are cached in Redis for 24 hours by default. Cache duration can be configured in the environment variables.
