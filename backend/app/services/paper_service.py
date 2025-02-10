import arxiv
from typing import List
import tempfile
import requests
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings  # Use direct import from langchain_openai
from langchain.chains import ConversationalRetrievalChain
from langchain_google_genai import ChatGoogleGenerativeAI
from ..models.paper import Paper, ChatResponse, Source
from ..core.config import get_settings
from fastapi import HTTPException

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
