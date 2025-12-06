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
    Использует тот же вызов, что и в твоём примере с requests.
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


# --------- ЗАГРУЗКА FAISS-ИНДЕКСА ---------

embeddings = OpenRouterEmbeddings(
    api_key="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",
    model="baai/bge-m3",
)

vectorstore = FAISS.load_local(
    "faiss_index",
    embeddings,
    allow_dangerous_deserialization=True,
)

retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

user_question = "Какая сумма выплаты на ребенка рожденного в г. Тула? Что нужно сделать для выплаты?"

retrieved_docs = retriever.invoke(user_question)
print(retrieved_docs)

# --------- СБОР КОНТЕКСТА И URL ---------

context_blocks = []
all_urls: set[str] = set()

for d in retrieved_docs:
    links_text = str(d.metadata.get("links") or "").strip()
    # вытаскиваем все URL из ячейки
    urls = re.findall(r"https?://\S+", links_text)
    all_urls.update(urls)

    block = (
        f"Вопрос из базы: {d.metadata.get('question')}\n"
        f"{d.page_content}\n"
        f"Ссылки на НПА: {links_text}\n"
    )
    context_blocks.append(block)

context = "\n\n---\n\n".join(context_blocks)

system_prompt = """
Ты — юридический консультант. Отвечай по-русски, кратко и понятным языком.
Используй только информацию из контекста. Не придумывай новых законов и ссылок.
В самом ответе не пиши URL — ссылки будут добавлены отдельно.
"""

user_prompt = f"""
Вопрос пользователя: {user_question}

Контекст из базы знаний:
{context}

Сформулируй ответ своими словами, но опирайся только на контекст.
Не упоминай никаких [Документ 1], [1.1] и тому подобных меток.
Просто дай человеческий ответ.
"""

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

# --------- ДОБАВЛЯЕМ ССЫЛКИ ПОСЛЕ ОТВЕТА ---------

final_answer = answer

unique_urls = sorted(all_urls)
if unique_urls:
    final_answer += "\n\nСсылки на НПА:\n" + "\n".join(unique_urls)

print(final_answer)
