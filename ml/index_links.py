import os
import re
from typing import List

import requests
import pandas as pd
from bs4 import BeautifulSoup

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
import time


# --------- ЭМБЕДДИНГИ ЧЕРЕЗ OPENROUTER ---------

class OpenRouterEmbeddings(Embeddings):
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
        payload = {"model": self.model, "input": inputs}

        resp = requests.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return [item["embedding"] for item in data["data"]]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self._embed(texts)

    def embed_query(self, text: str) -> List[float]:
        return self._embed([text])[0]


# --------- ХЕЛПЕРЫ ДЛЯ ТЕКСТА И ЧАНКОВ ---------

def extract_urls(links_cell: str) -> List[str]:
    """Парсим ячейку вида '1.https://...\n2.https://...' в список URL."""
    text = str(links_cell or "")
    return re.findall(r"https?://\S+", text)


def fetch_text_from_url(url: str, timeout: int = 60) -> str:
    """Грубый парсер текста со страницы с большим таймаутом и заголовками."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/131.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
    }

    # Можно добавить 1–2 попытки с паузой
    last_err = None
    for attempt in range(3):
        try:
            resp = requests.get(url, headers=headers, timeout=timeout)
            resp.raise_for_status()
            html = resp.text
            soup = BeautifulSoup(html, "html.parser")

            for tag in soup(["script", "style", "noscript"]):
                tag.decompose()

            text = soup.get_text(separator="\n")
            lines = [ln.strip() for ln in text.splitlines()]
            text = "\n".join(ln for ln in lines if ln)
            return text

        except Exception as e:
            last_err = e
            print(f"Попытка {attempt+1} не удалась для {url}: {e}")
            time.sleep(2)

    # если все попытки провалились — выбрасываем последнюю ошибку,
    # её поймает внешний try/except и выведет "Не удалось скачать ..."
    raise last_err



def split_into_chunks(text: str, chunk_size: int = 1500, chunk_overlap: int = 300) -> List[str]:
    """
    Простейший чанкер по символам. Можно заменить на RecursiveCharacterTextSplitter из langchain.
    """
    chunks = []
    start = 0
    n = len(text)
    while start < n:
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - chunk_overlap
    return chunks


# --------- СТРОИМ ДОКУМЕНТЫ ДЛЯ ИНДЕКСА НПА ---------

df = pd.read_excel("file_1.xlsx")

law_docs: List[Document] = []

for row_idx, row in df.iterrows():
    question = str(row["вопрос"])
    links_cell = row.get("Ссылка на НПА", "")
    urls = extract_urls(links_cell)

    for url in urls:
        try:
            full_text = fetch_text_from_url(url, timeout=60)
        except Exception as e:
            print(f"Не удалось скачать {url}: {e}")
            continue


        chunks = split_into_chunks(full_text, chunk_size=1500, chunk_overlap=300)

        for chunk_idx, chunk in enumerate(chunks, start=1):
            meta = {
                "source_url": url,               # <-- привязка к ссылке
                "question_from_excel": question, # на какой вопрос это НПА
                "row_index": int(row_idx),
                "chunk_index": chunk_idx,
            }
            law_docs.append(Document(page_content=chunk, metadata=meta))

print(f"Всего чанков НПА: {len(law_docs)}")

# --------- СОЗДАЁМ ИНДЕКС FAISS ДЛЯ НПА ---------

embeddings = OpenRouterEmbeddings(
    api_key="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",  # или из OPENROUTER_API_KEY
    model="openai/text-embedding-3-small",
)

law_vectorstore = FAISS.from_documents(law_docs, embeddings)
law_vectorstore.save_local("faiss_laws_index")
print("Индекс НПА сохранён в папку faiss_laws_index")
