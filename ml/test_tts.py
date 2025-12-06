# test_tts.py
import asyncio
from groq_tts import GroqTTSFixed  # имя файла/модуля — твой groq_tts.py

async def main():
    tts = GroqTTSFixed(
        api_key="",
        model="playai-tts",
        voice="Fritz-PlayAI",
        sample_rate=24000,
        speed=1.0,
    )

    text = "Привет! Это тест озвучки через Groq. Если ты меня слышишь, значит всё работает."
    out_file = "tts_test.wav"

    await tts.synthesize_to_wav_file(text, out_file)
    await tts.aclose()

    print(f"Готово! Файл сохранён как {out_file}")

if __name__ == "__main__":
    asyncio.run(main())
