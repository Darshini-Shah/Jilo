from typing import List, Dict
import os
from google import genai


class DocumentReRanker:
    def __init__(self):
        # Use Gemini API for reranking instead of local CrossEncoder model (saves ~500MB RAM)
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if api_key:
            self.client = genai.Client(api_key=api_key.strip().strip('"').strip("'"))
        else:
            self.client = None

    def rerank(self, query: str, chunks: List[Dict], top_k: int = 5) -> List[Dict]:
        """
        Re-rank retrieved chunks using Gemini API as a lightweight reranker.
        Falls back to RRF score ordering if Gemini is unavailable.
        """
        if not chunks:
            return []

        if not self.client:
            # Fallback: just return by existing score
            return chunks[:top_k]

        try:
            # Build a prompt that asks Gemini to score relevance
            chunk_texts = []
            for i, chunk in enumerate(chunks):
                text = chunk.get("text") or chunk.get("content", "")
                # Truncate long chunks to save tokens
                truncated = text[:300] if len(text) > 300 else text
                chunk_texts.append(f"[{i}] {truncated}")

            chunks_block = "\n".join(chunk_texts)

            prompt = f"""You are a medical document relevance scorer. 
Given the query and document chunks below, rate each chunk's relevance to the query on a scale of 0.0 to 1.0.
Return ONLY a JSON array of numbers (floats), one score per chunk, in the same order.

Query: {query}

Chunks:
{chunks_block}

Return format example: [0.95, 0.2, 0.8, 0.1, 0.6]
Return ONLY the JSON array, no other text."""

            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )

            import json
            scores_text = response.text.strip()
            # Clean potential markdown formatting
            scores_text = scores_text.replace("```json", "").replace("```", "").strip()
            scores = json.loads(scores_text)

            # Attach scores to chunk objects
            for chunk, score in zip(chunks, scores):
                chunk["cross_encoder_score"] = float(score)

            # Sort by score descending
            reranked = sorted(
                chunks,
                key=lambda x: x.get("cross_encoder_score", 0),
                reverse=True
            )

            return reranked[:top_k]

        except Exception as e:
            print(f"Warning: Gemini reranking failed ({e}), falling back to default ordering.")
            # Fallback: assign descending scores based on position
            for i, chunk in enumerate(chunks):
                chunk["cross_encoder_score"] = 1.0 - (i * 0.1)
            return chunks[:top_k]