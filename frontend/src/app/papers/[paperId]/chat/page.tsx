"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    // Redirect from /papers/[id]/chat to /papers/[id]/analyze
    if (params.paperId) {
      router.replace(`/papers/${params.paperId}/analyze`);
    }
  }, [params.paperId, router]);

  return null;
}
