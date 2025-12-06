import os
from typing import List
import re

import requests
from langchain_community.vectorstores import FAISS
from langchain_core.embeddings import Embeddings
from openai import OpenAI


# ============ НАСТРОЙКИ ============

OPENROUTER_API_KEY = "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"
HISTORY_FILE = "chat_history.txt"


# ============ ЭМБЕДДИНГИ ЧЕРЕЗ OPENROUTER ============

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


# ============ РАБОТА С ИСТОРИЕЙ В TXT ============

def load_history() -> str:
    """Читает историю переписки из txt. Если файла нет — возвращает пустую строку."""
    if not os.path.exists(HISTORY_FILE):
        return ""
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        return f.read().strip()


def append_to_history(user_question: str, assistant_answer: str) -> None:
    """Дописать новый ход диалога в историю."""
    with open(HISTORY_FILE, "a", encoding="utf-8") as f:
        f.write("Пользователь: " + user_question + "\n")
        f.write("Ассистент: " + assistant_answer + "\n")
        f.write("\n---\n\n")  # разделитель между ходами

def build_retrieval_query(last_user_question: str, history_text: str, client: OpenAI) -> str:
    """
    Переписывает последний вопрос пользователя в самодостаточный вид,
    учитывая историю переписки.
    """
    system_prompt = """
    Ты помощник, который переписывает вопрос пользователя так,
    чтобы он был самодостаточным и понятным без истории.
    Не отвечай на вопрос, только переформулируй его.
    """
    user_prompt = f"""
    История переписки:
    {history_text or "— истории нет —"}

    Последний вопрос пользователя:
    {last_user_question}

    Переформулируй этот вопрос так, 
    чтобы он был полностью понятен без истории.
    Если вопрос не является продолжением предыдущего, а касается уже другой темы. Просто перепиши последний вопрос пользователя
    """
    completion = client.chat.completions.create(
        model="openai/gpt-4.1-nano",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return completion.choices[0].message.content.strip()


# ============ ЗАГРУЗКА FAISS-ИНДЕКСА ============

embeddings = OpenRouterEmbeddings(
    api_key=OPENROUTER_API_KEY,
    model="baai/bge-m3",
)

vectorstore = FAISS.load_local(
    "faiss_index",
    embeddings,
    allow_dangerous_deserialization=True,
)

retriever = vectorstore.as_retriever(search_kwargs={"k": 3})


# ============ ФУНКЦИЯ ОТВЕТА (ОДИН ХОД) ============

def answer_question(user_question: str) -> str:
    # --- 0. Загружаем историю переписки из txt ---
    history_text = load_history()

    # --- 1. Создаём клиента OpenRouter (один раз на функцию) ---
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
    )

    # --- 2. Строим «самодостаточный» запрос для ретрива ---
    effective_query = build_retrieval_query(user_question, history_text, client)
    print("Effective retrieval query:", effective_query)

    # --- 3. Ретрив документов под ПЕРЕФОРМУЛИРОВАННЫЙ вопрос ---
    retrieved_docs = retriever.invoke(effective_query)
    print("Retrieved docs:", retrieved_docs)

    # --- 4. Собираем контекст и ссылки из индекса ---
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

    # --- 5. Формируем промпты для основного ответа ---

    system_prompt = """
Ты — юридический консультант. Отвечай по-русски, кратко и понятным языком.
Используй только информацию из контекста базы знаний.
Не придумывай новых законов и ссылок.
Если вопрос пользователя связан с предыдущей перепиской, учитывай её,
но финальный ответ всё равно должен опираться на контекст базы знаний ниже.
В самом ответе не пиши URL — ссылки будут добавлены отдельно.
"""

    # История идёт отдельным блоком — модель использует её как фон.
    history_block = (
        "Ниже приведена история переписки с пользователем (если она есть):\n\n"
        f"{history_text if history_text else '— истории пока нет —'}\n\n"
        "Новый вопрос пользователя и контекст базы знаний описаны далее.\n"
    )

    user_prompt = f"""
{history_block}

Новый вопрос пользователя:
{user_question}

Контекст из базы знаний:
{context}

Сформулируй ответ своими словами, но опирайся только на контекст.
Не упоминай никаких [Документ 1], [1.1] и тому подобных меток.
Просто дай человеческий ответ.
"""

    # --- 6. Вызов модели для ОТВЕТА (тем же client) ---
    completion = client.chat.completions.create(
        model="openai/gpt-4.1-nano",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    answer = completion.choices[0].message.content

    # --- 7. Добавляем ссылки после ответа ---
    final_answer = answer
    unique_urls = sorted(all_urls)
    if unique_urls:
        final_answer += "\n\nСсылки на НПА:\n" + "\n".join(unique_urls)

    # --- 8. Сохраняем ход в историю ---
    append_to_history(user_question, final_answer)

    return final_answer



# ============ ПРИМЕР ЗАПУСКА ============

if __name__ == "__main__":
    # один вопрос
    q = "До какого числа я смогу получать 80к?"
    resp = answer_question(q)
    print("\n=== ОТВЕТ МОДЕЛИ ===\n")
    print(resp)
