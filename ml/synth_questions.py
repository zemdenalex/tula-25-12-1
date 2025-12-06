import os
from typing import List

import pandas as pd
from openai import OpenAI


# ============ НАСТРОЙКИ ============

INPUT_FILES = ["file_1.xlsx", "file_2.xlsx"]           # два входных файла
OUTPUT_FILE = "questions_new_unanswered_both.csv"      # общий выходной файл

OPENROUTER_API_KEY = "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"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

MODEL_FOR_GENERATION = "openai/gpt-4.1-nano"           # можно заменить при желании


# ============ КЛИЕНТ OpenRouter ============

client = OpenAI(
    base_url=OPENROUTER_BASE_URL,
    api_key=OPENROUTER_API_KEY,
)


# ============ ГЕНЕРАЦИЯ НОВЫХ ВОПРОСОВ ============

def generate_new_questions(
    base_question: str,
    base_answer: str | None = None,
    n: int = 5,
) -> List[str]:
    """
    Генерирует N НОВЫХ вопросов по тематике исходного вопроса/ответа.
    Вопросы:
      - по той же теме,
      - не являются простой переформулировкой исходного,
      - могут уточнять детали, сроки, условия и т.п.
    Ответы НЕ возвращаются.
    """
    system_prompt = """
Ты помогаешь придумывать новые вопросы для базы знаний.

Тебе дают:
- исходный вопрос из базы;
- (опционально) ответ, который даётся пользователю.

Нужно придумать несколько НОВЫХ вопросов:
- по той же теме, в том же юридическом/социальном контексте;
- которые могли бы реально задать пользователи;
- НЕ являются простой переформулировкой исходного вопроса;
- могут уточнять детали, спрашивать про другие условия, сроки, ограничения и т.п.

Не давай ответы, только сами вопросы.
"""

    if base_answer is None:
        answer_text = "Ответ не предоставлен."
    else:
        answer_text = base_answer

    user_prompt = f"""
Исходный вопрос:
{base_question}

Ответ, который у нас есть (для ориентира):
{answer_text}

Сгенерируй {n} НОВЫХ вопросов по этой же теме.
Формат вывода:
- каждый новый вопрос с новой строки,
- без нумерации,
- без дополнительных комментариев и пояснений.
"""

    completion = client.chat.completions.create(
        model=MODEL_FOR_GENERATION,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    raw_text = completion.choices[0].message.content
    questions = [
        line.strip()
        for line in raw_text.splitlines()
        if line.strip()
    ]

    # Обрезаем до n на всякий случай
    return questions[:n]


# ============ ОСНОВНАЯ ЛОГИКА ============

def main():
    rows = []

    for input_file in INPUT_FILES:
        if not os.path.exists(input_file):
            print(f"⚠️ Файл {input_file} не найден, пропускаю.")
            continue

        print(f"Обрабатываю файл: {input_file}")
        df = pd.read_excel(input_file)

        if "вопрос" not in df.columns:
            raise ValueError(f"В файле {input_file} нет обязательного столбца 'вопрос'")

        has_answer = "ответ" in df.columns
        has_links = "Ссылка на НПА" in df.columns

        for i, row in df.iterrows():
            base_id = i
            base_q = str(row["вопрос"])
            base_a = str(row["ответ"]) if has_answer else None
            links = row["Ссылка на НПА"] if has_links else None

            # 1) исходный вопрос (для удобства, чтобы видеть контекст)
            rows.append({
                "source_file": input_file,
                "base_id": base_id,
                "type": "original",
                "question": base_q,
                "links": links,
            })

            # 2) новые вопросы без ответов
            try:
                new_questions = generate_new_questions(base_q, base_a, n=5)
            except Exception as e:
                print(f"Ошибка генерации для {input_file}, base_id={base_id}: {e}")
                new_questions = []

            for nq in new_questions:
                rows.append({
                    "source_file": input_file,
                    "base_id": base_id,
                    "type": "synthetic_new_unanswered",
                    "question": nq,
                    "links": links,  # можно оставить те же ссылки или заменить на None
                })

    if not rows:
        print("Не получилось собрать ни одной строки — проверь входные файлы.")
        return

    df_out = pd.DataFrame(rows)
    df_out.to_csv(OUTPUT_FILE, index=False, encoding="utf-8-sig")
    print(f"✅ Готово! Новые вопросы (с оригинальными) сохранены в {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
