import os
from typing import List

import requests
from langchain_community.vectorstores import FAISS
from langchain_core.embeddings import Embeddings
from openai import OpenAI


# --------- ЭМБЕДДИНГИ ЧЕРЕЗ OPENROUTER ---------

class OpenRouterEmbeddings(Embeddings):
    """
    Обёртка под /embeddings OpenRouter, совместимая с LangChain.
    Для запросов k=3 батчинг не нужен, т.к. мы эмбеддим только один текст-запрос.
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


# --------- ЗАГРУЗКА FAISS-ИНДЕКСА С ЧАНКАМИ НПА ---------

embeddings = OpenRouterEmbeddings(
    api_key="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",
    model="baai/bge-m3",
)

# ВАЖНО: здесь грузим НОВЫЙ индекс — тот, который ты собрал из txt (faiss_laws_index)
vectorstore = FAISS.load_local(
    "faiss_laws_index",
    embeddings,
    allow_dangerous_deserialization=True,
)

retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

user_question = "Какая сумма выплаты на ребенка рожденного в г. Тула?"

retrieved_docs = retriever.invoke(user_question)

# --------- СБОР КОНТЕКСТА: ЧАНК + URL ---------

context_blocks = []
used_urls = set()

for i, d in enumerate(retrieved_docs, start=1):
    url = d.metadata.get("source_url", "")
    used_urls.add(url)

    block = (
        f"Фрагмент {i}\n"
        f"Источник (URL): {url}\n\n"
        f"Текст фрагмента:\n{d.page_content}\n"
    )
    context_blocks.append(block)

context = "\n\n---\n\n".join(context_blocks)

system_prompt = """
Ты — юридический консультант. Отвечай по-русски, кратко и понятным языком.

Тебе даны фрагменты нормативных актов. Каждый фрагмент имеет вид:

Фрагмент N
Источник (URL): <ссылка>
Текст фрагмента:
<текст>

Твои задачи:
1) Найти в приведённых фрагментах норму, которая отвечает на вопрос пользователя.
2) Сначала своими словами объяснить ответ для пользователя, ссылаясь на релевантный контекст.
3) Затем напиши "Фрагмент: " и приведи дословную или слегка сокращённую цитату из наиболее релевантного фрагмента (2–3 предложения).
4) После цитаты укажи строку вида: "Источник: <URL>". И в <URL> напиши релевантный URL
5) Не придумывай новые законы и ссылки, используй только то, что есть в контексте.
"""

user_prompt = f"""
Вопрос пользователя: {user_question}

Контекст (фрагменты нормативных актов):
{context}

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

print(answer)
