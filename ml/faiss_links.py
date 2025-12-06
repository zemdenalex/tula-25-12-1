import os
from typing import List

import requests
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings


# ---- Эмбеддинги через OpenRouter (как у тебя) ----

class OpenRouterEmbeddings(Embeddings):
    """
    Простая обёртка под /embeddings OpenRouter, совместимая с LangChain.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str = "openai/text-embedding-3-small",
        base_url: str = "https://openrouter.ai/api/v1",
        batch_size: int = 32,   # <--- добавили батчинг
    ):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("Нужно передать api_key или установить OPENROUTER_API_KEY")
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.batch_size = batch_size

    def _embed_batch(self, inputs: List[str]) -> List[List[float]]:
        """Один HTTP запрос к /embeddings для списка строк."""
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
        # если HTTP-статус не 2xx — сразу бросаем ошибку
        resp.raise_for_status()
        data = resp.json()

        # Защита от ошибок API: нет поля "data" -> печатаем и падаем понятнее
        if "data" not in data:
            raise RuntimeError(f"Ошибка при запросе эмбеддингов: {data}")

        return [item["embedding"] for item in data["data"]]

    def _embed(self, inputs: List[str]) -> List[List[float]]:
        """Бьём inputs на батчи и делаем несколько запросов."""
        all_embeddings: List[List[float]] = []
        for i in range(0, len(inputs), self.batch_size):
            batch = inputs[i : i + self.batch_size]
            batch_embs = self._embed_batch(batch)
            all_embeddings.extend(batch_embs)
        return all_embeddings

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self._embed(texts)

    def embed_query(self, text: str) -> List[float]:
        return self._embed([text])[0]



# ---- Функция для нарезки на чанки ----

def split_into_chunks(text: str, chunk_size: int = 3500, chunk_overlap: int = 500) -> List[str]:
    """
    Простейший чанкер по символам.
    chunk_size – длина чанка,
    chunk_overlap – на сколько символов перекрываются соседние чанки.
    """
    chunks = []
    start = 0
    n = len(text)
    while start < n:
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - chunk_overlap
    return chunks


# ---- Читаем все txt из папки files/ и готовим документы ----

base_dir = "files"   # <- тут лежат твои txt с НПА
law_docs: List[Document] = []

for fname in os.listdir(base_dir):
    if not fname.lower().endswith(".txt"):
        continue

    path = os.path.join(base_dir, fname)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.splitlines()
    if not lines:
        continue

    first_line = lines[0].strip()
    if not first_line.startswith("URL:"):
        print(f"Файл {fname} пропускаем: первая строка не 'URL: ...'")
        continue

    url = first_line.replace("URL:", "", 1).strip()

    # считаем, что вторая строка пустая, а дальше идёт текст НПА
    body_text = "\n".join(lines[2:])  # если у тебя текст сразу на 2-й строке – поменяй на lines[1:]

    if not body_text.strip():
        print(f"Файл {fname}: нет текста после URL, пропускаем")
        continue

    chunks = split_into_chunks(body_text, chunk_size=1500, chunk_overlap=300)

    for idx, chunk in enumerate(chunks, start=1):
        meta = {
            "source_url": url,    # <-- то, что тебе нужно
            "file_name": fname,
            "chunk_index": idx,
        }
        law_docs.append(Document(page_content=chunk, metadata=meta))

print(f"Всего чанков НПА: {len(law_docs)}")

# ---- Строим FAISS-индекс для НПА ----

embeddings = OpenRouterEmbeddings(
    api_key="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",  # лучше вынести в OPENROUTER_API_KEY
    model="baai/bge-m3",
    batch_size=32
)

laws_vectorstore = FAISS.from_documents(law_docs, embeddings)
laws_vectorstore.save_local("faiss_laws_index")

print("Индекс НПА сохранён в папку faiss_laws_index")
