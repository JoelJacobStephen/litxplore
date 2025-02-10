import redis
import json
from typing import Optional, Dict, Any
from ..core.config import get_settings

settings = get_settings()

class RedisService:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            decode_responses=True
        )
        
    async def get_cached_review(self, topic: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached review for a given topic."""
        try:
            cached = self.redis_client.get(f"review:{topic}")
            if cached:
                return json.loads(cached)
            return None
        except redis.RedisError:
            return None
    
    async def cache_review(self, topic: str, review_data: Dict[str, Any], expire_time: int = 86400) -> bool:
        """Cache review data with expiration time (default 24 hours)."""
        try:
            self.redis_client.setex(
                f"review:{topic}",
                expire_time,
                json.dumps(review_data)
            )
            return True
        except redis.RedisError:
            return False
    
    def close(self):
        """Close Redis connection."""
        self.redis_client.close() 