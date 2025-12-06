import os
from typing import List
import re

import requests
from langchain_community.vectorstores import FAISS
from langchain_core.embeddings import Embeddings
from openai import OpenAI


# ============ НАСТРОЙКИ ============

# Лучше хранить ключ в переменной окружения OPENROUTER_API_KEY,
# а сюда поставить заглушку по умолчанию.
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


# ============ ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ============

def format_user_profile(
    region: str | None,
    child_age: str | None,
    pregnancy_term: str | None,
) -> str:
    """
    Превращает сырые поля в нормальный текстовый профиль
    для промпта/ретрива.
    """
    parts: list[str] = []

    if region:
        parts.append(f"Регион: {region}")
    if child_age:
        parts.append(f"Возраст ребёнка: {child_age}")
    if pregnancy_term:
        parts.append(f"Срок беременности: {pregnancy_term}")

    if not parts:
        return "Данные пользователя не указаны."

    return "\n".join(parts)


def build_retrieval_query(
    last_user_question: str,
    history_text: str,
    user_profile: str,
    client: OpenAI,
) -> str:
    """
    Переписывает последний вопрос пользователя в самодостаточный вид,
    учитывая историю переписки и профиль пользователя.
    """

    system_prompt = """
Ты помощник, который переписывает вопрос пользователя так,
чтобы он был самодостаточным и понятным без истории и интерфейса сервиса.
Не отвечай на вопрос, только переформулируй его.

Всегда сохраняй важные детали про:
- регион пользователя,
- возраст ребёнка,
- срок беременности,
если они важны для смысла вопроса (выплаты, льготы, сроки и т.п.).
"""

    user_prompt = f"""
Профиль пользователя:
{user_profile or "— профиль не указан —"}

История переписки:
{history_text or "— истории нет —"}

Последний вопрос пользователя:
{last_user_question}

Переформулируй этот вопрос так, 
чтобы он был полностью понятен без истории и интерфейса.
Если вопрос не является продолжением предыдущего и касается новой темы,
просто аккуратно перепиши последний вопрос пользователя, учитывая профиль.
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


# ============ ФУНКЦИЯ ОТВЕТА (ОДИН ХОД, С ПЕРСОНАЛИЗАЦИЕЙ) ============

def answer_question(
    user_question: str,
    region: str | None = None,
    child_age: str | None = None,
    pregnancy_term: str | None = None,
) -> str:
    """
    Основная функция ответа.
    Принимает вопрос + данные пользователя (регион, возраст ребёнка, срок беременности),
    использует их и на этапе ретрива, и при генерации ответа.
    """

    # --- 0. Загружаем историю переписки и формируем профиль ---
    history_text = load_history()
    user_profile = format_user_profile(region, child_age, pregnancy_term)

    # --- 1. Создаём клиента OpenRouter (один раз на функцию) ---
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
    )

    # --- 2. Строим «самодостаточный» запрос для ретрива с учётом профиля ---
    effective_query = build_retrieval_query(
        last_user_question=user_question,
        history_text=history_text,
        user_profile=user_profile,
        client=client,
    )
    print("Effective retrieval query:", effective_query)

    # --- 3. Ретрив документов под ПЕРЕФОРМУЛИРОВАННЫЙ вопрос ---
    retrieved_docs = retriever.invoke(effective_query)
    print("Retrieved docs:", retrieved_docs)

    # --- 4. Собираем контекст и ссылки из индекса ---
    context_blocks: list[str] = []
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
Не придумывай новых законов, сумм выплат и ссылок.

Обязательно учитывай профиль пользователя (регион, возраст ребёнка, срок беременности),
если это релевантно нормам в контексте:
- если в контексте явно указан тот же регион или возраст, объясни, как это относится к пользователю;
- если регион или возраст в контексте другой, честно скажи, что нормы могут отличаться,
  и не выдумывай детали, которых нет в тексте.

Если по контексту нельзя точно сказать, что действует в регионе пользователя,
прямо так и напиши, не фантазируй.

В самом ответе не пиши URL — ссылки будут добавлены отдельно.
"""

    profile_block = f"Профиль пользователя:\n{user_profile}\n"

    # История идёт отдельным блоком — модель использует её как фон.
    history_block = (
        "Ниже приведена история переписки с пользователем (если она есть):\n\n"
        f"{history_text if history_text else '— истории пока нет —'}\n\n"
        "Далее указан новый вопрос пользователя и контекст базы знаний.\n"
    )

    user_prompt = f"""
{profile_block}

{history_block}

Новый вопрос пользователя:
{user_question}

Контекст из базы знаний:
{context}

Сформулируй ответ своими словами, опираясь только на контекст.
Учитывай профиль пользователя, если это влияет на условия выплат, сроки или права.
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
    # Пример данных пользователя (в реальном сервисе будут приходить с фронта / формы)
    region = "Тульская область"
    child_age = "2 года"
    pregnancy_term = None  # или, например, "20 недель"

    q = "До какого числа я смогу получить 80к?"
    resp = answer_question(
        user_question=q,
        region=region,
        child_age=child_age,
        pregnancy_term=pregnancy_term,
    )
    print("\n=== ОТВЕТ МОДЕЛИ ===\n")
    print(resp)
