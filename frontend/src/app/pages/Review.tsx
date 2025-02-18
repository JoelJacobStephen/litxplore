import { Container } from "@mui/material";
import { ReviewDisplay } from "../../components/ReviewDisplay";
import { useReviewStore } from "@/lib/stores/review-store";

export const Review = () => {
  const generatedReview = useReviewStore((state) => state.generatedReview);

  return (
    <Container maxWidth="lg">
      {/* ...existing code... */}
      {generatedReview && <ReviewDisplay review={generatedReview.content} />}
      {/* ...existing code... */}
    </Container>
  );
};
