from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
import google.generativeai as genai
from datetime import datetime
from typing import List, Dict, Any
import arxiv
import asyncio
from ..core.config import get_settings
from ..models.paper import Paper

settings = get_settings()

# Initialize Gemini
model = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=settings.GEMINI_API_KEY,
    temperature=0.7
)

class LangChainService:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
        
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
        """Generate a comprehensive literature review using Gemini."""
        if not papers:
            return "# No Results\nNo papers found to generate review."
            
        # Create detailed paper summaries with their index for citation
        paper_summaries = []
        for i, paper in enumerate(papers, 1):
            summary = f"""Paper {i}:
Title: {paper.title}
Authors: {', '.join(paper.authors)}
Published: {paper.published}
Summary: {paper.summary}
Key Points:
- Main contributions and findings
- Methodology and approach
- Results and implications
- Limitations and future work
"""
            paper_summaries.append(summary)
        
        # Combine all paper summaries
        all_summaries = "\n\n".join(paper_summaries)
        
        # Generate the literature review with citations
        review_prompt = f"""Generate a comprehensive and detailed academic literature review based on the following papers. 
The review should focus on the topic: {topic}

{all_summaries}

Requirements for the literature review:

1. Structure and Formatting:
   - Use proper Markdown formatting throughout
   - Create a clear hierarchical structure with headings and subheadings
   - Use bullet points for listing key points
   - Use blockquotes for important findings or quotes
   - Use bold and italic text for emphasis

2. Content Requirements:
   - Provide an extensive introduction to the field and topic
   - Analyze and synthesize findings across all papers
   - Compare and contrast different approaches
   - Identify research trends and patterns
   - Discuss methodological approaches in detail
   - Highlight significant findings and their implications
   - Address limitations and challenges in the field
   - Suggest future research directions
   - Draw comprehensive conclusions

3. Citation and References:
   - Use numbered citations [1], [2], etc. that correspond to the paper numbers
   - Cite multiple papers when discussing common themes
   - Ensure every major claim is supported by citations
   - Include proper citation when discussing specific findings

4. Section Structure:

# Introduction
- Background of the field
- Importance of the topic
- Current state of research
- Objectives of this review

# Background and Context
- Historical development
- Theoretical foundations
- Key concepts and definitions

# Current Research Landscape
## Major Themes and Findings
- Theme 1 with detailed analysis
- Theme 2 with detailed analysis
- Cross-paper analysis and synthesis

## Methodological Approaches
- Analysis of different methods
- Comparison of approaches
- Strengths and limitations

## Key Findings and Implications
- Synthesis of major findings
- Practical implications
- Theoretical implications

# Research Gaps and Future Directions
- Current limitations
- Emerging trends
- Promising research directions
- Recommendations for future work

# Conclusion
- Summary of key findings
- State of the field
- Future outlook

Generate a detailed, well-structured review that thoroughly analyzes all papers and provides deep insights into the topic."""

        try:
            response = await asyncio.to_thread(
                lambda: model.generate_content(
                    review_prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.7,
                        top_p=0.9,
                        top_k=40,
                        max_output_tokens=8192,  # Increased for longer reviews
                    ),
                ).text
            )
            
            # Add a separator between citations
            citations_section = "\n\n# References\n"
            for i, paper in enumerate(papers, 1):
                citations_section += f"{i}. {', '.join(paper.authors)}. \"{paper.title}\". {paper.published.strftime('%Y')}.\n"
            
            return response + citations_section
        except Exception as e:
            print(f"Error generating review: {str(e)}")
            return "Error generating literature review."