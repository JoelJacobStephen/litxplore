from fastapi import APIRouter, Depends, Query, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional, AsyncGenerator
import arxiv
import json
import logging
from ....models.paper import Paper, ChatRequest, ChatResponse
from ....services.paper_service import PaperService
from ....core.config import get_settings
from ....utils.error_utils import raise_validation_error, raise_not_found, raise_internal_error, ErrorCode

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
            raise_validation_error(
                message="Either query or ids parameter is required",
                error_code=ErrorCode.VALIDATION_ERROR
            )
        return papers
    except Exception as e:
        logging.exception("Failed to search papers")
        raise_internal_error(
            message=f"Failed to search papers: {str(e)}",
            error_code=ErrorCode.INTERNAL_ERROR
        )

@router.get("/{paper_id}", response_model=Paper)
async def get_paper(paper_id: str):
    try:
        client = arxiv.Client()
        search = arxiv.Search(id_list=[paper_id])
        try:
            paper = next(client.results(search))
        except StopIteration:
            raise_not_found(
                message="Paper not found",
                details={"paper_id": paper_id}
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
        logging.exception(f"Failed to fetch paper {paper_id}")
        raise_internal_error(
            message=f"Failed to fetch paper: {str(e)}",
            error_code=ErrorCode.EXTERNAL_SERVICE_ERROR
        )

@router.post("/{paper_id}/chat")
async def chat_with_paper(paper_id: str, request: ChatRequest):
    """Chat endpoint with streaming support"""
    try:
        async def generate() -> AsyncGenerator[str, None]:
            async for chunk in paper_service.chat_with_paper_stream(
                paper_id, 
                request.message
            ):
                yield f"data: {json.dumps(chunk)}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream"
        )
        
    except Exception as e:
        logging.exception(f"Failed to process chat for paper {paper_id}")
        raise_internal_error(
            message=f"Failed to process chat: {str(e)}",
            error_code=ErrorCode.INTERNAL_ERROR
        )

# Add new endpoint for PDF upload
@router.post("/upload", response_model=Paper)
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise_validation_error(
            message="File must be a PDF",
            error_code=ErrorCode.VALIDATION_ERROR,
            details={"filename": file.filename}
        )
        
    try:
        paper = await paper_service.process_uploaded_pdf(file)
        return paper
    except Exception as e:
        logging.exception("Failed to process uploaded PDF")
        raise_internal_error(
            message=f"Failed to process PDF: {str(e)}",
            error_code=ErrorCode.INTERNAL_ERROR
        )
