from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_google_genai import GoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.schema.runnable import RunnablePassthrough
import google.generativeai as genai
from datetime import datetime
from typing import List, Dict, Any
import arxiv
import asyncio
from ..core.config import get_settings
from ..models.paper import Paper

settings = get_settings()

class LangChainService:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
        
        self.llm = GoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.7
        )
        
        self.review_prompt = PromptTemplate(
            input_variables=["papers", "topic"],
            template="""Please write a comprehensive literature review on the topic: {topic}
            
            Based on the following papers:
            
            {papers}
            
            Focus on:
            1. Key findings and contributions
            2. Common themes and patterns
            3. Research gaps and future directions
            4. Critical analysis and synthesis
            
            Format the review in a clear, academic style with proper paragraphs.
            """
        )
        
        self.chain = self.review_prompt | self.llm
        
    async def fetch_papers(self, topic: str, max_papers: int) -> List[Paper]:
        """Fetch relevant papers from ArXiv."""
        client = arxiv.Client()
        search = arxiv.Search(
            query=topic,
            max_results=max_papers,
            sort_by=arxiv.SortCriterion.Relevance
        )
        
        # Convert the iterator to a list to make it compatible with async
        papers = list(client.results(search))
        
        return [
            Paper(
                id=paper.entry_id.split('/')[-1],
                title=paper.title,
                authors=[author.name for author in paper.authors],
                published=paper.published,
                summary=paper.summary,
                url=paper.pdf_url
            )
            for paper in papers
        ]
    
    async def process_papers(self, papers: List[Paper]) -> List[Dict[str, Any]]:
        """Process papers and prepare them for review generation."""
        documents = []
        for paper in papers:
            try:
                # Use arxiv client directly instead of ArxivLoader
                client = arxiv.Client()
                search = arxiv.Search(id_list=[paper.id])
                paper_doc = next(client.results(search))
                
                # Create document from paper content
                doc = {
                    "page_content": f"{paper_doc.title}\n\n{paper_doc.summary}",
                    "metadata": {
                        "title": paper_doc.title,
                        "authors": [author.name for author in paper_doc.authors],
                        "published": paper_doc.published,
                        "id": paper.id
                    }
                }
                
                # Split document into chunks
                chunks = await asyncio.to_thread(
                    self.text_splitter.split_text,
                    doc["page_content"]
                )
                
                # Add chunks to documents list
                documents.extend([{
                    "page_content": chunk,
                    "metadata": doc["metadata"]
                } for chunk in chunks])
                
            except Exception as e:
                print(f"Error processing paper {paper.id}: {str(e)}")
                continue
        
        return documents
    
    async def analyze_paper(self, text: str) -> str:
        """Analyze a single paper using Gemini."""
        prompt = f"""Analyze the following academic paper excerpt and extract key findings, methodology, and contributions:

{text}

Provide a concise analysis focusing on:
1. Main findings and contributions
2. Methodology used
3. Key implications
4. Limitations (if mentioned)

Format the response in a clear, academic style."""

        try:
            response = await asyncio.to_thread(
                lambda: model.generate_content(prompt).text
            )
            return response
        except Exception as e:
            print(f"Error analyzing paper: {str(e)}")
            return "Error analyzing paper content."
    
    async def generate_review(self, papers: List[Paper], topic: str) -> str:
        try:
            # Format papers into a string
            papers_text = "\n\n".join([
                f"Title: {p.title}\nAuthors: {', '.join(p.authors)}\nSummary: {p.summary}"
                for p in papers
            ])
            
            # Generate review using RunnableSequence
            result = await self.chain.ainvoke({
                "papers": papers_text,
                "topic": topic
            })
            
            return result.text if hasattr(result, 'text') else str(result)
            
        except Exception as e:
            print(f"Error generating review: {str(e)}")
            raise Exception("Failed to generate literature review")