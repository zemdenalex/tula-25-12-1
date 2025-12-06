import os
from typing import List

import requests
from langchain_community.vectorstores import FAISS
from langchain_core.embeddings import Embeddings


# та же обёртка, что выше
class OpenRouterEmbeddings(Embeddings):
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
        payload = {"model": self.model, "input": inputs}
        resp = requests.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return [item["embedding"] for item in data["data"]]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self._embed(texts)

    def embed_query(self, text: str) -> List[float]:
        return self._embed([text])[0]


INDEX_DIR = "faiss_suggestions"

# грузим индекс
embeddings = OpenRouterEmbeddings(
    api_key="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",
    model="baai/bge-m3",
)

vectorstore = FAISS.load_local(
    INDEX_DIR,
    embeddings,
    allow_dangerous_deserialization=True,
)

suggestion_retriever = vectorstore.as_retriever(search_kwargs={"k": 3})


def get_suggested_questions(user_question: str) -> List[str]:
    """
    По входному вопросу возвращает 3 рекомендованных вопроса,
    которые пользователь мог бы задать дальше.
    Берутся из FAISS-индекса синтетических вопросов.
    """
    docs = suggestion_retriever.invoke(user_question)
    # page_content — сам текст синтетического вопроса
    return [d.page_content for d in docs]


if __name__ == "__main__":
    q = "Какая сумма выплаты на ребенка, рожденного в Туле?"
    suggestions = get_suggested_questions(q)
    print("Рекомендуемые вопросы:")
    for s in suggestions:
        print("-", s)
