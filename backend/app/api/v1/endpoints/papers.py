from fastapi import APIRouter, Depends, Query, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional, AsyncGenerator
import arxiv
import json
import logging
import os
from ....models.paper import Paper, ChatRequest, ChatResponse
from ....services.paper_service import PaperService
from ....core.config import get_settings
from ....core.auth import get_current_user
from ....models.user import User
from ....utils.error_utils import raise_validation_error, raise_not_found, raise_internal_error, ErrorCode

router = APIRouter()
paper_service = PaperService()

# Define maximum file size (15MB in bytes)
MAX_FILE_SIZE = 15 * 1024 * 1024

def is_valid_pdf(content: bytes) -> bool:
    """
    Check if the file content is a valid PDF by examining the header.
    PDF files must start with %PDF- followed by version number.
    """
    if len(content) < 8:
        return False
    
    # Check for PDF header
    header = content[:8]
    return header.startswith(b'%PDF-')

@router.get("/search", response_model=List[Paper], operation_id="searchPapers")
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

@router.get("/{paper_id}", response_model=Paper, operation_id="getPaper")
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

@router.post("/{paper_id}/chat", operation_id="chatWithPaper")
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

# Enhanced PDF upload endpoint with security checks
@router.post("/upload", response_model=Paper, operation_id="uploadPaper")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    
    # Check if file exists and has a filename
    if not file or not file.filename:
        raise_validation_error(
            message="No file provided",
            error_code=ErrorCode.VALIDATION_ERROR
        )
    
    # Validate file extension
    if not file.filename.lower().endswith('.pdf'):
        raise_validation_error(
            message="File must be a PDF",
            error_code=ErrorCode.VALIDATION_ERROR,
            details={"filename": file.filename}
        )
        
    # Create a temporary file to check size and contents
    temp_file_path = None
    try:
        # Read a small part of the file first to check content type
        content_start = await file.read(2048)
        
        # Check if the file is a valid PDF by examining the header
        if not is_valid_pdf(content_start):
            raise_validation_error(
                message="Invalid file content. The file does not appear to be a valid PDF",
                error_code=ErrorCode.VALIDATION_ERROR
            )
        
        # Reset file position to beginning
        await file.seek(0)
        
        # Get file size (with size limit)
        file_size = 0
        temp_file_path = os.path.join('/tmp', f"temp_upload_{os.urandom(8).hex()}.pdf")
        with open(temp_file_path, 'wb') as temp_file:
            while True:
                chunk = await file.read(1024 * 1024)  # Read 1MB at a time
                if not chunk:
                    break
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    raise_validation_error(
                        message=f"File size exceeds the maximum allowed size of {MAX_FILE_SIZE // (1024 * 1024)}MB",
                        error_code=ErrorCode.VALIDATION_ERROR
                    )
                temp_file.write(chunk)
        
        # Reset the file again for processing
        await file.seek(0)
        
        paper = await paper_service.process_uploaded_pdf(file)
        return paper
    except HTTPException:
        # Re-raise HTTPExceptions (like validation errors)
        raise
    except Exception as e:
        logging.exception("Failed to process uploaded PDF")
        raise_internal_error(
            message=f"Failed to process PDF: {str(e)}",
            error_code=ErrorCode.INTERNAL_ERROR
        )
    finally:
        # Clean up temp file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception:
                pass
