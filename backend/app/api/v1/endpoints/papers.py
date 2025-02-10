from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
import arxiv
from ....models.paper import Paper, ChatRequest, ChatResponse
from ....services.paper_service import PaperService
from ....core.config import get_settings

router = APIRouter()
paper_service = PaperService()

@router.get("/search", response_model=List[Paper])
async def search_papers(
    query: Optional[str] = None,
    ids: Optional[str] = None
):
    try:
        if ids:
            # Split comma-separated IDs and fetch those specific papers
            paper_ids = [id.strip() for id in ids.split(",")]
            papers = await paper_service.get_papers_by_ids(paper_ids)
        elif query:
            # Search papers by query
            papers = await paper_service.search_papers(query)
        else:
            raise HTTPException(
                status_code=400,
                detail="Either query or ids parameter is required"
            )
        return papers
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search papers: {str(e)}"
        )

@router.get("/{paper_id}", response_model=Paper)
async def get_paper(paper_id: str):
    try:
        client = arxiv.Client()
        search = arxiv.Search(id_list=[paper_id])
        try:
            paper = next(client.results(search))
        except StopIteration:
            raise HTTPException(
                status_code=404,
                detail="Paper not found"
            )
            
        return Paper(
            id=paper.entry_id.split('/')[-1],
            title=paper.title,
            authors=[author.name for author in paper.authors],
            summary=paper.summary,
            published=paper.published,
            url=paper.pdf_url
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch paper: {str(e)}"
        )

@router.post("/{paper_id}/chat", response_model=ChatResponse)
async def chat_with_paper(paper_id: str, request: ChatRequest):
    try:
        response = await paper_service.chat_with_paper(paper_id, request.message)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process chat: {str(e)}"
        )
