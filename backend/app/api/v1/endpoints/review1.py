from typing import List
# ...existing code...

@router.post("/generate-review")
async def generate_review(request: ReviewRequest):
    try:
        # ...existing code...
        
        # Convert islice to list for async compatibility
        chunks = [chunk async for chunk in text_splitter.split_documents(documents)]
        filtered_chunks = chunks[:max_chunks]  # Replace itertools.islice with regular slicing
        
        # Process the filtered chunks
        for chunk in filtered_chunks:
            # Your existing chunk processing logic
            pass
            
        # ...existing code...
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate review: {str(e)}"
        )
