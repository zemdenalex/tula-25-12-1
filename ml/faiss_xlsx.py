import os
import requests
from typing import List
import pandas as pd
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings


class OpenRouterEmbeddings(Embeddings):
    """
    Простая обёртка под /embeddings OpenRouter, совместимая с LangChain.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str = "openai/text-embedding-3-small",
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
            "input": inputs,  # список строк
        }

        resp = requests.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()

        # data["data"] — список объектов с полем "embedding"
        return [item["embedding"] for item in data["data"]]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        # можно добавить разбиение по батчам, если нужно
        return self._embed(texts)

    def embed_query(self, text: str) -> List[float]:
        return self._embed([text])[0]

# 1. Загружаем таблицу
df = pd.read_excel("file_1.xlsx")  # или read_csv

# 2. Готовим документы для индекса
docs = []
for i, (_, row) in enumerate(df.iterrows(), start=1):
    content = f"Вопрос: {row['вопрос']}\nОтвет: {row['ответ']}"
    metadata = {
        "id": i,  # свой порядковый номер
        "question": row["вопрос"],
        "links": row["Ссылка на НПА"],
    }
    docs.append(Document(page_content=content, metadata=metadata))


# 3. Создаём объект эмбеддингов через OpenRouter
embeddings = OpenRouterEmbeddings(
    api_key="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",  # лучше вынести в переменную окружения
    model="openai/text-embedding-3-small",
)

# 4. Строим FAISS-индекс
vectorstore = FAISS.from_documents(docs, embeddings)

# 5. Сохраняем индекс
vectorstore.save_local("faiss_index")
