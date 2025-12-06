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
    Использует тот же вызов, что и в твоём примере с requests.
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

        return [item["embedding"] for item in data["data"]]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self._embed(texts)

    def embed_query(self, text: str) -> List[float]:
        return self._embed([text])[0]


# --------- ЗАГРУЗКА FAISS-ИНДЕКСА ---------

embeddings = OpenRouterEmbeddings(
    api_key="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",
    model="openai/text-embedding-3-small",
)

vectorstore = FAISS.load_local(
    "faiss_index",
    embeddings,
    allow_dangerous_deserialization=True,
)

retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

user_question = "Какова сумма материнского (семейного) капитала?"

# ВАЖНО: используем публичный метод / Runnable API
# вариант 1:
retrieved_docs = retriever.invoke(user_question)
# вариант 2 (тоже можно):
# retrieved_docs = retriever.get_relevant_documents(user_question)

# --------- СБОР КОНТЕКСТА ---------

context_blocks = []
for d in retrieved_docs:
    block = (
        f"Вопрос из базы: {d.metadata.get('question')}\n"
        f"{d.page_content}\n"
        f"Ссылки на НПА: {d.metadata.get('links')}\n"
    )
    context_blocks.append(block)

context = "\n\n---\n\n".join(context_blocks)

system_prompt = """
Ты — юридический консультант. Отвечай по-русски, кратко и понятным языком.
Используй только информацию из контекста. Обязательно укажи ссылки на НПА, если они есть.
"""

user_prompt = f"""
Вопрос пользователя: {user_question}

Контекст из базы знаний:
{context}

Сформулируй ответ своими словами, но опирайся только на контекст.
"""

# --------- ВЫЗОВ LLM ЧЕРЕЗ OPENROUTER ---------

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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",
)

completion = client.chat.completions.create(
    model="meta-llama/llama-3.3-70b-instruct:free",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ],
)

print(completion.choices[0].message.content)
