import arxiv
from typing import List, Dict, Any  # Add Dict and Any to imports
import tempfile
import os
import requests
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain.chains import ConversationalRetrievalChain
from langchain_google_genai import ChatGoogleGenerativeAI
from ..models.paper import Paper, ChatResponse, Source
from ..core.config import get_settings
from fastapi import HTTPException
import hashlib
from fastapi import UploadFile
from datetime import datetime

settings = get_settings()

class PaperService:
    def __init__(self):
        try:
            # Initialize OpenAI embeddings
            if not settings.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY not found in environment variables")
            
            self.embeddings = OpenAIEmbeddings(
                model="text-embedding-ada-002",
                openai_api_key=settings.OPENAI_API_KEY,
                show_progress_bar=True,
                client=None  # Let the client be created automatically
            )

            # Initialize Gemini
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY not found in environment variables")
                
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.7
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize AI services: {str(e)}"
            )
        
    async def search_papers(self, query: str) -> List[Paper]:
        client = arxiv.Client()
        search = arxiv.Search(
            query=query,
            max_results=10,
            sort_by=arxiv.SortCriterion.Relevance
        )
        
        papers = []
        for result in client.results(search):
            papers.append(Paper(
                id=result.entry_id.split("/")[-1],
                title=result.title,
                authors=[author.name for author in result.authors],
                summary=result.summary,
                published=result.published,
                url=result.pdf_url
            ))
        
        return papers

    async def get_papers_by_ids(self, paper_ids: List[str]) -> List[Paper]:
        """Fetch papers by their IDs."""
        try:
            # Format paper IDs properly for arXiv API
            formatted_ids = []
            for paper_id in paper_ids:
                # Remove version suffix if present (e.g., v1, v2)
                base_id = paper_id.split('v')[0]
                formatted_ids.append(base_id)

            client = arxiv.Client()
            # Use arxiv.Search with properly formatted IDs
            search = arxiv.Search(
                query=" OR ".join([f"id:{id}" for id in formatted_ids]),
                max_results=len(paper_ids)
            )
            
            papers = []
            for result in client.results(search):
                paper_id = result.entry_id.split("/")[-1].split("v")[0]  # Get base ID
                papers.append(Paper(
                    id=paper_id,
                    title=result.title,
                    authors=[author.name for author in result.authors],
                    summary=result.summary,
                    published=result.published,
                    url=result.pdf_url
                ))
            
            if not papers:
                raise ValueError("No papers found with the provided IDs")
                
            return papers
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch papers: {str(e)}"
            )

    async def chat_with_paper(self, paper_id: str, message: str) -> ChatResponse:
        # Fetch paper
        client = arxiv.Client()
        search = arxiv.Search(id_list=[paper_id])
        paper = next(client.results(search))
        
        # Download PDF
        response = requests.get(paper.pdf_url)
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_pdf:
            temp_pdf.write(response.content)
            temp_pdf_path = temp_pdf.name
            
        try:
            # Load and process PDF
            loader = PyPDFLoader(temp_pdf_path)
            documents = loader.load()
            
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                separators=["\n\n", "\n", " ", ""]
            )
            texts = text_splitter.split_documents(documents)
            
            # Create vector store
            vectorstore = FAISS.from_documents(texts, self.embeddings)
            
            # Create QA chain
            qa_chain = ConversationalRetrievalChain.from_llm(
                llm=self.llm,
                retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
                return_source_documents=True
            )
            
            # Get response
            result = qa_chain({
                "question": message,
                "chat_history": []
            })
            
            return ChatResponse(
                response=result["answer"],
                sources=[Source(page=doc.metadata.get("page", 0)) for doc in result["source_documents"]]
            )
            
        finally:
            import os
            os.unlink(temp_pdf_path)

    async def process_uploaded_pdf(self, file: UploadFile) -> Paper:
        """Process an uploaded PDF file and convert it to a Paper object."""
        temp_pdf_path = None
        try:
            # Create uploads directory if it doesn't exist
            upload_dir = "uploads"
            os.makedirs(upload_dir, exist_ok=True)

            # Create a temporary file to store the PDF
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_pdf:
                content = await file.read()
                temp_pdf.write(content)
                temp_pdf_path = temp_pdf.name

            # Extract text from PDF
            loader = PyPDFLoader(temp_pdf_path)
            pages = loader.load()
            
            # Combine text from all pages
            full_text = "\n".join(page.page_content for page in pages)
            
            # Generate a unique ID for the paper based on content hash
            content_hash = hashlib.sha256(content).hexdigest()[:10]
            
            # Use Gemini to extract title, authors, and summary
            prompt = """Extract the following information from this academic paper:
            1. Title
            2. Authors (comma-separated)
            3. Brief summary (2-3 sentences)
            
            Format the response exactly as:
            Title: <extracted title>
            Authors: <extracted authors>
            Summary: <extracted summary>"""
            
            response = self.llm.invoke(prompt + "\n\nText:" + full_text[:2000])
            result = response.content  # Access the content attribute instead of text

            # Parse the result
            lines = result.split("\n")
            title = "Untitled Paper"
            authors = []
            summary = ""

            for line in lines:
                if line.startswith("Title:"):
                    title = line.replace("Title:", "").strip()
                elif line.startswith("Authors:"):
                    authors = [a.strip() for a in line.replace("Authors:", "").split(",")]
                elif line.startswith("Summary:"):
                    summary = line.replace("Summary:", "").strip()
            
            # Save the PDF to the uploads directory
            pdf_path = os.path.join(upload_dir, f"{content_hash}.pdf")
            with open(pdf_path, "wb") as f:
                # Seek to beginning of file since we already read it
                f.write(content)

            # Use default values if extraction failed
            if not title:
                title = file.filename or "Untitled Paper"
            if not authors:
                authors = ["Unknown Author"]
            if not summary:
                summary = "No summary available."

            return Paper(
                id=f"upload_{content_hash}",
                title=title,
                authors=authors,
                summary=summary,
                published=datetime.now(),
                url=f"/uploads/{content_hash}.pdf"
            )

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error processing PDF: {str(e)}"
            )
        finally:
            # Clean up temporary file
            if temp_pdf_path and os.path.exists(temp_pdf_path):
                os.unlink(temp_pdf_path)

    async def get_uploaded_papers(self, paper_ids: List[str]) -> List[Paper]:
        """Fetch papers that were previously uploaded."""
        papers = []
        upload_dir = "uploads"

        for paper_id in paper_ids:
            if not paper_id.startswith('upload_'):
                continue
                
            content_hash = paper_id.replace('upload_', '')
            pdf_path = os.path.join(upload_dir, f"{content_hash}.pdf")
            
            if not os.path.exists(pdf_path):
                continue
                
            # Load metadata from vector store or cache
            paper_data = await self.get_paper_metadata(content_hash)
            if paper_data:
                papers.append(Paper(**paper_data))

        return papers

    async def get_paper_metadata(self, content_hash: str) -> Dict[str, Any]:
        """Retrieve paper metadata from storage."""
        # TODO: Implement proper metadata storage
        # For now, return metadata from PDF parsing
        pdf_path = os.path.join("uploads", f"{content_hash}.pdf")
        
        try:
            loader = PyPDFLoader(pdf_path)
            pages = loader.load()
            full_text = "\n".join(page.page_content for page in pages)
            
            # Use saved metadata or extract again if needed
            # This is a simplified version - in production, store metadata in a database
            return {
                "id": f"upload_{content_hash}",
                "title": "Uploaded Paper",  # Replace with actual stored metadata
                "authors": ["Unknown Author"],  # Replace with actual stored metadata
                "summary": full_text[:500] + "...",
                "published": datetime.now().isoformat(),
                "url": f"/uploads/{content_hash}.pdf"
            }
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve paper metadata: {str(e)}"
            )

    async def generate_review(self, topic: str, papers: List[Paper], max_papers: int = 10) -> str:
        """Generate literature review using both ArXiv and uploaded papers."""
        try:
            documents = []
            
            for paper in papers[:max_papers]:
                if paper.id.startswith('upload_'):
                    # Handle uploaded PDFs
                    content_hash = paper.id.replace('upload_', '')
                    pdf_path = os.path.join("uploads", f"{content_hash}.pdf")
                    if os.path.exists(pdf_path):
                        loader = PyPDFLoader(pdf_path)
                        documents.extend(loader.load())
                else:
                    # Handle ArXiv papers
                    pass  # Add ArXiv paper processing code here
                    
            # Placeholder for review generation logic
            return "Generated review placeholder"
            
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to generate review: {str(e)}"
            )
