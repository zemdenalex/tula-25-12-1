import os
from typing import List

import requests
import pandas as pd
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings


# ============ ЭМБЕДДИНГИ ЧЕРЕЗ OPENROUTER ============

class OpenRouterEmbeddings(Embeddings):
    """
    Простая обёртка под /embeddings OpenRouter, совместимая с LangChain.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str = "baai/bge-m3",
        base_url: str = "https://openrouter.ai/api/v1",
    ):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("Нужно передать api_key или установить OPENROUTER_API_KEY")
        self.model = model
        self.base_url = base_url.rstrip("/")

    def _embed(self, inputs: List[str]) -> List[List[float]]:
        url = f"{self.base_url}/embeddings"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "input": inputs,
        }

        resp = requests.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()

        return [item["embedding"] for item in data["data"]]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self._embed(texts)

    def embed_query(self, text: str) -> List[float]:
        return self._embed([text])[0]


# ============ СТРОИМ ИНДЕКС ДЛЯ РЕКОМЕНДАЦИЙ ============

INPUT_CSV = "questions_new_unanswered_both.csv"
INDEX_DIR = "faiss_suggestions"  # название папки с индексом

def build_suggestions_index():
    df = pd.read_csv(INPUT_CSV)

    required_cols = ["question", "type"]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"В CSV нет обязательного столбца: {col}")

    # Берём только синтетические "следующие" вопросы
    df_syn = df[df["type"] == "synthetic_new_unanswered"].copy()
    if df_syn.empty:
        raise ValueError("В файле нет строк с type='synthetic_new_unanswered'")

    docs = []
    for i, row in df_syn.iterrows():
        question_text = str(row["question"])

        metadata = {
            "source_file": row.get("source_file", ""),
            "base_id": int(row.get("base_id", -1)) if not pd.isna(row.get("base_id", -1)) else -1,
            "links": row.get("links", ""),
            "type": row.get("type", ""),
        }

        docs.append(Document(page_content=question_text, metadata=metadata))

    embeddings = OpenRouterEmbeddings(
        api_key="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",
        model="baai/bge-m3",  # можно сменить на baai/bge-m3, если хочешь
    )

    vectorstore = FAISS.from_documents(docs, embeddings)
    vectorstore.save_local(INDEX_DIR)
    print(f"Индекс с рекомендованными вопросами сохранён в папку: {INDEX_DIR}")


if __name__ == "__main__":
    build_suggestions_index()
