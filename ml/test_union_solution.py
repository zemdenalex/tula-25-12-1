import os
from typing import List
import re

import requests
from langchain_community.vectorstores import FAISS
from langchain_core.embeddings import Embeddings
from openai import OpenAI


# --------- ЭМБЕДДИНГИ ЧЕРЕЗ OPENROUTER ---------

class OpenRouterEmbeddings(Embeddings):
    """
    Обёртка под /embeddings OpenRouter, совместимая с LangChain.
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
            "input": inputs,
        }

        resp = requests.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()

        if "data" not in data:
            raise RuntimeError(f"Ошибка при запросе эмбеддингов: {data}")

        return [item["embedding"] for item in data["data"]]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self._embed(texts)

    def embed_query(self, text: str) -> List[float]:
        return self._embed([text])[0]


# --------- СОЗДАЁМ ЭМБЕДДЕР ---------

embeddings = OpenRouterEmbeddings(
    api_key="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",
    model="baai/bge-m3",
)

# --------- ЗАГРУЗКА ДВУХ ИНДЕКСОВ ---------
# 1) faiss_index — база вопросов/ответов, без прямого цитирования НПА
qa_vectorstore = FAISS.load_local(
    "faiss_index",
    embeddings,
    allow_dangerous_deserialization=True,
)
qa_retriever = qa_vectorstore.as_retriever(search_kwargs={"k": 1})

# 2) faiss_laws_index — чанки НПА с полем source_url
laws_vectorstore = FAISS.load_local(
    "faiss_laws_index",
    embeddings,
    allow_dangerous_deserialization=True,
)
laws_retriever = laws_vectorstore.as_retriever(search_kwargs={"k": 3})


# --------- ВОПРОС ПОЛЬЗОВАТЕЛЯ ---------

user_question = "Как оформить выплату на питание беременным женщинам?"


# --------- РЕТРИВ ДОКУМЕНТОВ ИЗ ОБОИХ ИНДЕКСОВ ---------

qa_docs = qa_retriever.invoke(user_question)        # из faiss_index
laws_docs = laws_retriever.invoke(user_question)    # из faiss_laws_index


# --------- СБОР КОНТЕКСТА ИЗ БАЗЫ Q&A (faiss_index) ---------
# Здесь мы намеренно НЕ используем поля с URL/links — они нам больше не нужны.

qa_blocks = []
for d in qa_docs:
    block = (
        f"Элемент базы вопросов-ответов\n"
        f"Вопрос из базы: {d.metadata.get('question')}\n\n"
        f"Текст/ответ:\n{d.page_content}\n"
    )
    qa_blocks.append(block)

qa_context = "\n\n---\n\n".join(qa_blocks) if qa_blocks else "Нет совпадений."


# --------- СБОР КОНТЕКСТА ИЗ НПА (faiss_laws_index) ---------

laws_blocks = []
used_law_urls: set[str] = set()

for i, d in enumerate(laws_docs, start=1):
    url = (d.metadata.get("source_url") or "").strip()
    if url:
        used_law_urls.add(url)

    block = (
        f"Фрагмент {i}\n"
        f"Источник (URL): {url}\n\n"
        f"Текст фрагмента:\n{d.page_content}\n"
    )
    laws_blocks.append(block)

laws_context = "\n\n---\n\n".join(laws_blocks) if laws_blocks else "Нет фрагментов НПА."


# --------- ПРОМПТЫ ДЛЯ МОДЕЛИ ---------

system_prompt = """
Ты — юридический консультант. Отвечай по-русски, кратко и понятным языком.

Тебе даны два вида контекста:

1) База вопросов и ответов (обобщённые формулировки, описания ситуаций).
2) Фрагменты нормативных актов с URL-источниками.

Требования к ответу:

1. Сначала кратко и понятно ответь на вопрос пользователя своими словами.
   Ты можешь использовать информацию и из базы Q&A, и из фрагментов НПА,
   но любые правовые формулировки, суммы выплат, условия и ссылки должны
   опираться на фрагменты НПА.

2. Затем добавь строку вида:
   "Фрагмент: <цитата из наиболее релевантного фрагмента НПА (2–3 предложения)>"

3. После этого добавь строку:
   "Источник: <URL>"
   — URL бери только из тех фрагментов НПА, которые даны в контексте.

4. Не придумывай новых законов, сумм и ссылок. Если информации явно нет,
   честно напиши, что по приведённым фрагментам это определить нельзя.
"""

user_prompt = f"""
Вопрос пользователя:
{user_question}

Контекст 1 — база вопросов и ответов:
{qa_context}

Контекст 2 — фрагменты нормативных актов:
{laws_context}

Сформулируй ответ по правилам из инструкции.
"""


# --------- ВЫЗОВ LLM ЧЕРЕЗ OPENROUTER ---------

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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",
)

completion = client.chat.completions.create(
    model="openai/gpt-4.1-nano",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ],
)

answer = completion.choices[0].message.content


# --------- ДОБАВЛЯЕМ ИТОГОВЫЙ СПИСОК URL (ТОЛЬКО ИЗ НПА) ---------

# final_answer = answer

# unique_law_urls = sorted(u for u in used_law_urls if u)
# if unique_law_urls:
#     final_answer += "\n\nСсылки на НПА:\n" + "\n".join(unique_law_urls)

# print(final_answer)
