import { Container } from "@mui/material";
import { ReviewDisplay } from "../../components/ReviewDisplay";
import { useReviewStore } from "@/lib/stores/review-store";

export const Review = () => {
  const generatedReview = useReviewStore((state) => state.generatedReview);

  return (
    <Container maxWidth="lg">
      {generatedReview && (
        <ReviewDisplay
          review={generatedReview.review}
          topic={generatedReview.topic}
          citations={generatedReview.citations}
        />
      )}
    </Container>
  );
};
