import os
from dotenv import load_dotenv
from google import genai
import psycopg2

load_dotenv(dotenv_path="config/.env")


class HybridRetriever:
    def __init__(self):
        # Use Gemini embeddings instead of local HuggingFace model (saves ~900MB RAM)
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY environment variable not set.")
        self.client = genai.Client(api_key=api_key.strip().strip('"').strip("'"))

    def get_connection(self):
        return psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            dbname=os.getenv("DB_NAME")
        )

    def _embed_query(self, query: str) -> list:
        """Generate embeddings using Gemini API instead of local torch model."""
        result = self.client.models.embed_content(
            model="models/text-embedding-004",
            contents=query
        )
        return result.embeddings[0].values

    def vector_search(self, query: str, top_k: int = 5):
        """
        Perform vector similarity search using pgvector.
        """
        conn = self.get_connection()

        try:
            query_vector = self._embed_query(query)

            sql = """
            SELECT id, content, metadata,
                1 - (embedding <=> %s::vector) AS similarity
            FROM chunks
            ORDER BY embedding <=> %s::vector
            LIMIT %s;
            """

            with conn.cursor() as cur:
                cur.execute(sql, (query_vector, query_vector, top_k))
                rows = cur.fetchall()

            results = []
            for rank, row in enumerate(rows, start=1):
                results.append({
                    "id": row[0],
                    "text": row[1],
                    "metadata": row[2],
                    "score": row[3],
                    "rank": rank
                })

            return results

        finally:
            conn.close()

    def keyword_search(self, query: str, top_k: int = 5):
        """
        Perform keyword search using PostgreSQL FTS.
        """

        conn = self.get_connection()

        try:
            sql = """
            SELECT id, content, metadata,
                ts_rank_cd(
                    to_tsvector('english', content),
                    plainto_tsquery('english', %s)
                ) AS rank_score
            FROM chunks
            WHERE to_tsvector('english', content)
                @@ plainto_tsquery('english', %s)
            ORDER BY rank_score DESC
            LIMIT %s;
            """

            with conn.cursor() as cur:
                cur.execute(sql, (query, query, top_k))
                rows = cur.fetchall()

            results = []
            for rank, row in enumerate(rows, start=1):
                results.append({
                    "id": row[0],
                    "text": row[1],
                    "metadata": row[2],
                    "score": row[3],
                    "rank": rank
                })

            return results

        finally:
            conn.close()

    def hybrid_search(self, query: str, top_k: int = 5):
        """
        Combine vector and keyword search results using Reciprocal Rank Fusion.
        """

        vector_results = self.vector_search(query, top_k)
        keyword_results = self.keyword_search(query, top_k)

        rrf_scores = {}
        rrf_k = 60  # standard constant used in RRF

        def add_scores(results):
            for result in results:
                doc_id = result["id"]
                rank = result["rank"]

                score = 1 / (rrf_k + rank)

                if doc_id not in rrf_scores:
                    rrf_scores[doc_id] = {
                        "text": result["text"],
                        "metadata": result["metadata"],
                        "rrf_score": 0
                    }

                rrf_scores[doc_id]["rrf_score"] += score

        add_scores(vector_results)
        add_scores(keyword_results)

        merged = list(rrf_scores.values())

        merged.sort(key=lambda x: x["rrf_score"], reverse=True)

        return merged[:top_k]