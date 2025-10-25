import hashlib
import json
import logging
import os
import re
import tempfile
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
import requests
import arxiv

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import ValidationError

from ..models.analysis import (
    PaperAnalysis,
    PaperMetadata,
    AtAGlanceAnalysis,
    KeyInsightsAnalysis,
    FigureExplanation,
    SuggestedQuestion,
    InDepthAnalysis,
)
from ..models.paper import Paper
from ..core.config import get_settings
from fastapi import HTTPException
from .analysis_helpers import (
    invoke_llm_with_retry,
    parse_at_a_glance_json,
    parse_suggested_questions_json,
    parse_limitations_future_work_json,
    parse_in_depth_json,
)
from .analysis_resilience import (
    create_fallback_at_a_glance,
    create_fallback_suggested_questions,
    extract_text_with_fallback,
)

logger = logging.getLogger(__name__)
settings = get_settings()


class AnalysisService:
    def __init__(self):
        try:
            if not settings.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY not found in environment variables")
            
            self.embeddings = OpenAIEmbeddings(
                model="text-embedding-ada-002",
                openai_api_key=settings.OPENAI_API_KEY,
            )

            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY not found in environment variables")
                
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.7
            )
            
            # Initialize Redis cache (optional, can be None if not configured)
            self.cache = self._init_cache()
            
            # Load prompt templates
            self.prompts = self._load_prompts()
            
        except Exception as e:
            logger.error(f"Failed to initialize AnalysisService: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize analysis service: {str(e)}"
            )

    def _init_cache(self):
        """Initialize Redis cache if available."""
        try:
            import redis
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
            return redis.from_url(redis_url, decode_responses=True)
        except Exception as e:
            logger.warning(f"Redis cache not available: {str(e)}")
            return None

    def _load_prompts(self) -> Dict[str, str]:
        """Load prompt templates from files."""
        prompts = {}
        prompt_dir = os.path.join(os.path.dirname(__file__), "..", "prompts", "analyzer")
        
        prompt_files = {
            "at_a_glance": "at_a_glance.txt",
            "suggested_questions": "suggested_questions.txt",
            "limitations_future_work": "limitations_future_work.txt",
            "figure_explanation": "figure_explanation.txt",
            "in_depth": "in_depth.txt",
        }
        
        for key, filename in prompt_files.items():
            try:
                path = os.path.join(prompt_dir, filename)
                if os.path.exists(path):
                    with open(path, "r") as f:
                        prompts[key] = f.read()
                else:
                    logger.warning(f"Prompt file not found: {path}")
            except Exception as e:
                logger.warning(f"Failed to load prompt {key}: {str(e)}")
        
        return prompts

    def _get_paper_hash(self, paper_id: str, paper_bytes: Optional[bytes] = None) -> str:
        """
        Compute content hash for cache key.
        
        For uploads: SHA256 of PDF bytes
        For arXiv: URL + ETag or fetched bytes' hash
        """
        if paper_bytes:
            return hashlib.sha256(paper_bytes).hexdigest()[:16]
        
        # For arXiv papers, use paper_id as hash
        return hashlib.sha256(paper_id.encode()).hexdigest()[:16]

    def _get_cache_key(self, paper_hash: str, key_type: str = "analysis") -> str:
        """Generate versioned cache key."""
        schema_version = settings.PROMPT_VERSION or "1.0.0"
        model_tag = settings.ANALYZER_MODEL_TAG or "gemini-2.0-flash"
        
        if key_type == "key_insights":
            return f"analysis:{paper_hash}:{schema_version}:{model_tag}:key_insights"
        return f"analysis:{paper_hash}:{schema_version}:{model_tag}"

    async def _fetch_paper(self, paper_id: str) -> tuple[Paper, bytes]:
        """Fetch paper from arXiv or uploads directory."""
        if paper_id.startswith("upload_"):
            # Handle uploaded PDF
            content_hash = paper_id.replace("upload_", "")
            pdf_path = os.path.join("uploads", f"{content_hash}.pdf")
            
            if not os.path.exists(pdf_path):
                raise HTTPException(
                    status_code=404,
                    detail=f"Uploaded paper not found: {paper_id}"
                )
            
            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()
            
            # Return minimal paper metadata for uploads
            paper = Paper(
                id=paper_id,
                title="Uploaded Paper",
                authors=["Unknown"],
                summary="",
                published=datetime.now(),
                url=f"/uploads/{content_hash}.pdf"
            )
            return paper, pdf_bytes
        else:
            # Fetch from arXiv
            try:
                client = arxiv.Client()
                search = arxiv.Search(id_list=[paper_id])
                arxiv_paper = next(client.results(search))
                
                # Download PDF
                response = requests.get(arxiv_paper.pdf_url, timeout=30)
                response.raise_for_status()
                pdf_bytes = response.content
                
                paper = Paper(
                    id=arxiv_paper.entry_id.split("/")[-1],
                    title=arxiv_paper.title,
                    authors=[author.name for author in arxiv_paper.authors],
                    summary=arxiv_paper.summary,
                    published=arxiv_paper.published,
                    url=arxiv_paper.pdf_url
                )
                return paper, pdf_bytes
                
            except StopIteration:
                raise HTTPException(
                    status_code=404,
                    detail=f"Paper not found on arXiv: {paper_id}"
                )
            except Exception as e:
                logger.error(f"Failed to fetch paper from arXiv: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to fetch paper: {str(e)}"
                )

    async def _extract_text_with_pages(self, pdf_path: str) -> tuple[str, Dict[int, str]]:
        """Extract text from PDF with page mapping."""
        try:
            loader = PyPDFLoader(pdf_path)
            pages = loader.load()
            
            full_text = ""
            page_map = {}
            
            for i, page in enumerate(pages):
                page_map[i] = page.page_content
                full_text += f"\n--- Page {i + 1} ---\n{page.page_content}"
            
            return full_text, page_map
            
        except Exception as e:
            logger.error(f"Failed to extract text from PDF: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Failed to extract text from PDF: {str(e)}"
            )

    async def _generate_at_a_glance(self, full_text: str) -> AtAGlanceAnalysis:
        """Generate At-a-Glance analysis using LLM with retry logic."""
        prompt_template = self.prompts.get("at_a_glance", "")
        if not prompt_template:
            prompt_template = """Analyze this academic paper and provide a structured summary in JSON format.

Return ONLY valid JSON matching this exact structure (no markdown, no extra text):
{{
  "one_sentence_summary": "A single concise sentence summarizing the paper's main contribution",
  "key_contributions": ["contribution 1", "contribution 2", "contribution 3"],
  "methodology": "2-4 sentences describing the research methodology in plain English",
  "key_result": "The single most important finding or result from the paper"
}}

Paper text:
{text}"""
        
        return await invoke_llm_with_retry(
            self.llm,
            prompt_template.format(text=full_text[:3000]),
            response_parser=parse_at_a_glance_json,
            fallback=AtAGlanceAnalysis(
                title="Unable to extract title",
                authors=["Unknown"],
                affiliations=["Unknown"],
                abstract="Unable to extract abstract",
                keywords=["Unable to extract keywords"],
                introduction="Unable to extract introduction",
                related_work="Unable to extract related work",
                problem_statement="Unable to extract problem statement",
                methodology="Unable to extract methodology",
                results="Unable to extract results",
                discussion="Unable to extract discussion",
                limitations=["Unable to extract limitations"],
                future_work=["Unable to extract future work"],
                conclusion="Unable to extract conclusion"
            )
        )

    async def _generate_suggested_questions(self, full_text: str) -> List[SuggestedQuestion]:
        """Generate suggested questions for the paper with retry logic."""
        prompt_template = self.prompts.get("suggested_questions", "")
        if not prompt_template:
            prompt_template = """Based on this academic paper, generate 5 insightful questions a researcher might ask.

Return ONLY valid JSON matching this exact structure (no markdown, no extra text):
[
  {{
    "question": "Question text here?",
    "category": "methodology"
  }},
  {{
    "question": "Question text here?",
    "category": "results"
  }}
]

Valid categories: methodology, results, limitations, applications, datasets, reproducibility

Paper text:
{text}"""
        
        return await invoke_llm_with_retry(
            self.llm,
            prompt_template.format(text=full_text[:3000]),
            response_parser=parse_suggested_questions_json,
            fallback=[
                SuggestedQuestion(question="What is the main methodology used in this paper?", category="methodology"),
                SuggestedQuestion(question="What are the key results presented?", category="results"),
                SuggestedQuestion(question="What limitations does the paper acknowledge?", category="limitations"),
                SuggestedQuestion(question="What are the practical applications of this research?", category="applications"),
                SuggestedQuestion(question="What datasets were used in this study?", category="datasets"),
            ]
        )

    def _detect_figures_and_tables(self, page_map: Dict[int, str]) -> List[tuple[str, int]]:
        """Detect figures and tables using regex and page lookup."""
        pattern = r"^(Figure|Fig\.|Table|Tab\.)\s+(\d+)[:\.\s]"
        detected = []
        
        for page_num, text in page_map.items():
            lines = text.split("\n")
            for line in lines:
                match = re.match(pattern, line, re.IGNORECASE)
                if match:
                    detected.append((line.strip(), page_num))
        
        return detected

    async def _generate_figure_explanation(self, label: str, caption: str) -> str:
        """Generate explanation for a figure/table with retry logic."""
        prompt_template = self.prompts.get("figure_explanation", "")
        if not prompt_template:
            prompt_template = """Explain what this figure/table shows in 2-3 sentences:

Label: {label}
Caption: {caption}

Provide a clear, concise explanation."""
        
        prompt = prompt_template.format(label=label, caption=caption)
        
        return await invoke_llm_with_retry(
            self.llm,
            prompt,
            response_parser=lambda r: r,
            fallback="Unable to generate explanation"
        )

    async def _extract_limitations_and_future_work(self, full_text: str) -> tuple[List[str], List[str]]:
        """Extract limitations and future work from paper with retry logic."""
        prompt_template = self.prompts.get("limitations_future_work", "")
        if not prompt_template:
            prompt_template = """Extract the limitations and future work from this paper section.

Return ONLY valid JSON matching this exact structure (no markdown, no extra text):
{{
  "limitations": ["limitation 1", "limitation 2"],
  "future_work": ["future work 1", "future work 2"]
}}

Paper text:
{text}"""
        
        result = await invoke_llm_with_retry(
            self.llm,
            prompt_template.format(text=full_text[-2000:]),
            response_parser=parse_limitations_future_work_json,
            fallback=([], [])
        )
        return result

    async def analyze_paper(
        self,
        paper_id: str,
        force_refresh: bool = False,
        user_id: Optional[str] = None
    ) -> PaperAnalysis:
        """
        Analyze a paper and generate At-a-Glance + Suggested Questions.
        
        Does NOT compute Key Insights (lazy-loaded on demand).
        """
        try:
            # Fetch paper
            paper, pdf_bytes = await self._fetch_paper(paper_id)
            paper_hash = self._get_paper_hash(paper_id, pdf_bytes)
            cache_key = self._get_cache_key(paper_hash)
            
            # Check cache if not forcing refresh
            if not force_refresh and self.cache:
                try:
                    cached = self.cache.get(cache_key)
                    if cached:
                        logger.info(f"Cache hit for paper {paper_id}")
                        return PaperAnalysis(**json.loads(cached))
                except Exception as e:
                    logger.warning(f"Cache retrieval failed: {str(e)}")
            
            # Extract text from PDF
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(pdf_bytes)
                tmp_path = tmp.name
            
            try:
                full_text, page_map = await self._extract_text_with_pages(tmp_path)
                
                # Generate At-a-Glance and Suggested Questions in parallel
                at_a_glance, suggested_questions = await asyncio.gather(
                    self._generate_at_a_glance(full_text),
                    self._generate_suggested_questions(full_text),
                    return_exceptions=False
                )
                
                # Create metadata
                metadata = PaperMetadata(
                    paper_id=paper.id,
                    title=paper.title,
                    authors=paper.authors,
                    year=paper.published.year if paper.published else None,
                    url=paper.url,
                    source="upload" if paper_id.startswith("upload_") else "arxiv"
                )
                
                # Create analysis response
                analysis = PaperAnalysis(
                    paper=metadata,
                    at_a_glance=at_a_glance,
                    key_insights=None,  # Lazy-loaded
                    suggested_questions=suggested_questions,
                    generated_at=datetime.now(),
                    schema_version=settings.PROMPT_VERSION or "1.0.0",
                    model_tag=settings.ANALYZER_MODEL_TAG or "gemini-2.0-flash"
                )
                
                # Cache the result
                if self.cache:
                    try:
                        ttl = 3600 if os.getenv("ENV") == "dev" else 86400  # 1h dev, 24h prod
                        self.cache.setex(cache_key, ttl, analysis.model_dump_json())
                    except Exception as e:
                        logger.warning(f"Cache write failed: {str(e)}")
                
                return analysis
                
            finally:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to analyze paper {paper_id}: {str(e)}", exc_info=True)
            # Graceful fallback: return a minimal analysis instead of 500
            try:
                # Try to at least fetch paper metadata for PDF viewing
                try:
                    paper, _ = await self._fetch_paper(paper_id)
                    metadata = PaperMetadata(
                        paper_id=paper.id,
                        title=paper.title,
                        authors=paper.authors,
                        year=paper.published.year if paper.published else None,
                        url=paper.url,
                        source="upload" if paper_id.startswith("upload_") else "arxiv"
                    )
                except Exception as fetch_error:
                    logger.warning(f"Could not fetch paper metadata for fallback: {str(fetch_error)}")
                    metadata = PaperMetadata(
                        paper_id=paper_id,
                        title="Analysis Unavailable",
                        authors=[],
                        year=None,
                        url=None,
                        source="upload" if paper_id.startswith("upload_") else "arxiv",
                    )
                
                analysis = PaperAnalysis(
                    paper=metadata,
                    at_a_glance=AtAGlanceAnalysis(
                        title="Unable to extract title",
                        authors=["Unknown"],
                        affiliations=["Unknown"],
                        abstract="Unable to extract abstract",
                        keywords=["Unable to extract keywords"],
                        introduction="Unable to extract introduction",
                        related_work="Unable to extract related work",
                        problem_statement="Unable to extract problem statement",
                        methodology="Unable to extract methodology",
                        results="Unable to extract results",
                        discussion="Unable to extract discussion",
                        limitations=["Unable to extract limitations"],
                        future_work=["Unable to extract future work"],
                        conclusion="Unable to extract conclusion"
                    ),
                    key_insights=None,
                    suggested_questions=[
                        SuggestedQuestion(question="What is the main methodology used in this paper?", category="methodology"),
                        SuggestedQuestion(question="What are the key results presented?", category="results"),
                        SuggestedQuestion(question="What limitations does the paper acknowledge?", category="limitations"),
                        SuggestedQuestion(question="What are the practical applications of this research?", category="applications"),
                        SuggestedQuestion(question="What datasets were used in this study?", category="datasets"),
                    ],
                    generated_at=datetime.now(),
                    schema_version=settings.PROMPT_VERSION or "1.0.0",
                    model_tag=settings.ANALYZER_MODEL_TAG or "gemini-2.0-flash",
                )
                return analysis
            except Exception as fallback_error:
                # If even the fallback fails, then surface the original error
                logger.error(
                    f"Fallback analysis construction failed: {str(fallback_error)}",
                    exc_info=True,
                )
                raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    async def get_paper_analysis(
        self,
        paper_id: str,
        user_id: Optional[str] = None
    ) -> Optional[PaperAnalysis]:
        """Retrieve cached analysis for a paper."""
        try:
            paper, pdf_bytes = await self._fetch_paper(paper_id)
            paper_hash = self._get_paper_hash(paper_id, pdf_bytes)
            cache_key = self._get_cache_key(paper_hash)
            
            if self.cache:
                cached = self.cache.get(cache_key)
                if cached:
                    return PaperAnalysis(**json.loads(cached))
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to retrieve analysis for {paper_id}: {str(e)}")
            return None

    async def compute_key_insights(
        self,
        paper_id: str,
        user_id: Optional[str] = None
    ) -> PaperAnalysis:
        """
        Compute Key Insights (figures/limitations/future work) for a paper.
        
        First retrieves or generates the base analysis, then adds key insights.
        """
        try:
            # Get or generate base analysis
            analysis = await self.get_paper_analysis(paper_id, user_id)
            if not analysis:
                analysis = await self.analyze_paper(paper_id, user_id=user_id)
            
            # Fetch paper for text extraction
            paper, pdf_bytes = await self._fetch_paper(paper_id)
            
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(pdf_bytes)
                tmp_path = tmp.name
            
            try:
                full_text, page_map = await self._extract_text_with_pages(tmp_path)
                
                # Detect figures and tables
                detected = self._detect_figures_and_tables(page_map)
                
                # Generate explanations for figures/tables and limitations/future work in parallel
                figure_tasks = [
                    self._generate_figure_explanation(label, label)
                    for label, _ in detected[:5]
                ]
                
                explanations, (limitations, future_work) = await asyncio.gather(
                    asyncio.gather(*figure_tasks, return_exceptions=False) if figure_tasks else asyncio.sleep(0),
                    self._extract_limitations_and_future_work(full_text),
                    return_exceptions=False
                )
                
                # Build figures list
                figures = []
                for (label, page_num), explanation in zip(detected[:5], explanations if figure_tasks else []):
                    figures.append(FigureExplanation(
                        label=label,
                        caption=label,
                        explanation=explanation,
                        page=page_num
                    ))
                
                # Create key insights
                key_insights = KeyInsightsAnalysis(
                    figures=figures,
                    limitations=limitations if isinstance(limitations, list) else [],
                    future_work=future_work if isinstance(future_work, list) else []
                )
                
                # Update analysis with key insights
                analysis.key_insights = key_insights
                
                # Cache the updated analysis
                paper_hash = self._get_paper_hash(paper_id, pdf_bytes)
                cache_key = self._get_cache_key(paper_hash)
                
                if self.cache:
                    try:
                        ttl = 3600 if os.getenv("ENV") == "dev" else 86400
                        self.cache.setex(cache_key, ttl, analysis.model_dump_json())
                    except Exception as e:
                        logger.warning(f"Cache write failed: {str(e)}")
                
                return analysis
                
            finally:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to compute key insights for {paper_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Key insights computation failed: {str(e)}")

    async def compute_in_depth(
        self,
        paper_id: str,
        user_id: Optional[str] = None
    ) -> PaperAnalysis:
        """
        Compute In-Depth Analysis for comprehensive understanding of each paper section.
        
        First retrieves or generates the base analysis, then adds in-depth analysis.
        """
        try:
            # Get or generate base analysis
            analysis = await self.get_paper_analysis(paper_id, user_id)
            if not analysis:
                analysis = await self.analyze_paper(paper_id, user_id=user_id)
            
            # Fetch paper for text extraction
            paper, pdf_bytes = await self._fetch_paper(paper_id)
            
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(pdf_bytes)
                tmp_path = tmp.name
            
            try:
                full_text, _ = await self._extract_text_with_pages(tmp_path)
                
                # Generate in-depth analysis using LLM
                prompt_template = self.prompts.get("in_depth", "")
                if not prompt_template:
                    raise ValueError("In-depth prompt template not found")
                
                # Use more text for comprehensive analysis
                text_for_analysis = full_text[:15000]  # Use more text for in-depth
                
                try:
                    in_depth = await invoke_llm_with_retry(
                        self.llm,
                        prompt_template.format(text=text_for_analysis),
                        response_parser=parse_in_depth_json,
                        fallback=InDepthAnalysis(
                            introduction="The analysis could not be generated due to technical issues. Please try again or refresh the page.",
                            related_work="The analysis could not be generated due to technical issues. Please try again or refresh the page.",
                            problem_statement="The analysis could not be generated due to technical issues. Please try again or refresh the page.",
                            methodology="The analysis could not be generated due to technical issues. Please try again or refresh the page.",
                            results="The analysis could not be generated due to technical issues. Please try again or refresh the page.",
                            discussion="The analysis could not be generated due to technical issues. Please try again or refresh the page.",
                            limitations="The analysis could not be generated due to technical issues. Please try again or refresh the page.",
                            conclusion_future_work="The analysis could not be generated due to technical issues. Please try again or refresh the page.",
                        ),
                        max_retries=3,  # More retries for comprehensive analysis
                        timeout=60,     # Longer timeout for comprehensive analysis
                    )
                except Exception as parse_error:
                    logger.error(f"Failed to parse in-depth analysis after all retries: {str(parse_error)}")
                    # Return fallback instead of raising
                    in_depth = InDepthAnalysis(
                        introduction="The analysis could not be generated. The AI response was not in the expected format. Please try again.",
                        related_work="The analysis could not be generated. The AI response was not in the expected format. Please try again.",
                        problem_statement="The analysis could not be generated. The AI response was not in the expected format. Please try again.",
                        methodology="The analysis could not be generated. The AI response was not in the expected format. Please try again.",
                        results="The analysis could not be generated. The AI response was not in the expected format. Please try again.",
                        discussion="The analysis could not be generated. The AI response was not in the expected format. Please try again.",
                        limitations="The analysis could not be generated. The AI response was not in the expected format. Please try again.",
                        conclusion_future_work="The analysis could not be generated. The AI response was not in the expected format. Please try again.",
                    )
                
                # Update analysis with in-depth content
                analysis.in_depth = in_depth
                
                # Cache the updated analysis
                paper_hash = self._get_paper_hash(paper_id, pdf_bytes)
                cache_key = self._get_cache_key(paper_hash)
                
                if self.cache:
                    try:
                        ttl = 3600 if os.getenv("ENV") == "dev" else 86400
                        self.cache.setex(cache_key, ttl, analysis.model_dump_json())
                    except Exception as e:
                        logger.warning(f"Cache write failed: {str(e)}")
                
                return analysis
                
            finally:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to compute in-depth analysis for {paper_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"In-depth analysis computation failed: {str(e)}")
