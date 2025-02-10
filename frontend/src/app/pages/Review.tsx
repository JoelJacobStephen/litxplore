import { Container } from "@mui/material";
import { ReviewDisplay } from "../../components/ReviewDisplay";
// ...existing imports...

export const Review = () => {
  // ...existing code...

  return (
    <Container maxWidth="lg">
      {/* ...existing code... */}
      {review && <ReviewDisplay review={review} />}
      {/* ...existing code... */}
    </Container>
  );
};
