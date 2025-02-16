from typing import List
from ..models.paper import Paper
from fastapi import HTTPException
from datetime import datetime
import markdown2
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListItem, ListFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO

class DocumentService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        # Create custom styles
        self.styles.add(ParagraphStyle(
            name='Citation',
            parent=self.styles['Normal'],
            leftIndent=20,
            fontSize=9
        ))

    async def generate_document(self, content: str, citations: List[Paper], topic: str, format: str) -> bytes:
        """Generate a document in the specified format (PDF or plain text)."""
        try:
            if format == 'latex':
                # Return plain text format instead of LaTeX
                return self._create_text_content(content, citations, topic).encode('utf-8')
            
            # Generate PDF using ReportLab
            buffer = BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72
            )

            # Convert markdown to HTML and create PDF elements
            story = []
            
            # Add title
            story.append(Paragraph(topic, self.styles['Title']))
            story.append(Spacer(1, 12))
            
            # Add date
            story.append(Paragraph(
                datetime.now().strftime('%B %d, %Y'),
                self.styles['Normal']
            ))
            story.append(Spacer(1, 24))
            
            # Convert markdown content to paragraphs
            html_content = markdown2.markdown(content)
            for line in html_content.split('\n'):
                if line.strip():
                    if line.startswith('#'):
                        # Handle headers
                        level = len(line.split()[0])
                        text = ' '.join(line.split()[1:])
                        style = f'Heading{min(level, 3)}'
                        story.append(Paragraph(text, self.styles[style]))
                        story.append(Spacer(1, 12))
                    else:
                        # Regular paragraph
                        story.append(Paragraph(line, self.styles['Normal']))
                        story.append(Spacer(1, 12))
            
            # Add references section
            story.append(Paragraph('References', self.styles['Heading1']))
            story.append(Spacer(1, 12))
            
            # Add citations
            citations_list = []
            for i, paper in enumerate(citations, 1):
                citation_text = f"[{i}] {', '.join(paper.authors)}. {paper.title}. ({paper.published.year})"
                if paper.url:
                    citation_text += f" Available at: {paper.url}"
                citations_list.append(ListItem(
                    Paragraph(citation_text, self.styles['Citation'])
                ))
            
            story.append(ListFlowable(
                citations_list,
                bulletType='1',
                start=1
            ))
            
            # Build PDF
            doc.build(story)
            pdf_content = buffer.getvalue()
            buffer.close()
            
            return pdf_content
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Document generation failed: {str(e)}"
            )

    def _create_text_content(self, content: str, citations: List[Paper], topic: str) -> str:
        """Create plain text version of the document."""
        text = f"""
{topic}
{'=' * len(topic)}

Date: {datetime.now().strftime('%B %d, %Y')}

{content}

References
----------
"""
        for i, paper in enumerate(citations, 1):
            authors = ", ".join(paper.authors)
            text += f"\n[{i}] {authors}. {paper.title}. ({paper.published.year})"
            if paper.url:
                text += f"\n    URL: {paper.url}"
        
        return text
