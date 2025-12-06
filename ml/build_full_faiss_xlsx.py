import os
from typing import List

import requests
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

        if "data" not in data:
            raise RuntimeError(f"Ошибка при запросе эмбеддингов: {data}")

        return [item["embedding"] for item in data["data"]]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        # при желании сюда можно добавить батчинг
        return self._embed(texts)

    def embed_query(self, text: str) -> List[float]:
        return self._embed([text])[0]


# ---------- 1. Загружаем оба файла ----------

files = ["file_1.xlsx", "file_2.xlsx"]

dfs = []
for fname in files:
    if not os.path.exists(fname):
        print(f"Внимание: файл {fname} не найден, пропускаю")
        continue
    df = pd.read_excel(fname)
    df["__source_file"] = fname  # запомним, из какого файла строка
    dfs.append(df)

if not dfs:
    raise RuntimeError("Не удалось найти ни одного файла для индексации")

df_all = pd.concat(dfs, ignore_index=True)

# ---------- 2. Готовим документы для индекса ----------

docs: List[Document] = []

for i, (_, row) in enumerate(df_all.iterrows(), start=1):
    question = str(row.get("вопрос", "")).strip()
    answer = str(row.get("ответ", "")).strip()
    links = row.get("Ссылка на НПА", "")

    if not question and not answer:
        continue  # пустые строки пропускаем

    content = f"Вопрос: {question}\nОтвет: {answer}"

    metadata = {
        "id": i,
        "question": question,
        "links": links,
        "source_file": row.get("__source_file", ""),
    }

    docs.append(Document(page_content=content, metadata=metadata))

print(f"Всего документов для индекса: {len(docs)}")

# ---------- 3. Создаём объект эмбеддингов через OpenRouter ----------

embeddings = OpenRouterEmbeddings(
    api_key="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",  # или убери и используй переменную окружения OPENROUTER_API_KEY
    model="baai/bge-m3",
)

# ---------- 4. Строим FAISS-индекс и сохраняем ----------

vectorstore = FAISS.from_documents(docs, embeddings)
vectorstore.save_local("faiss_index")

print("Индекс по file_1.xlsx и file_2.xlsx сохранён в папку faiss_index")
