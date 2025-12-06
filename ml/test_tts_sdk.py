# simple_groq_tts.py
import os
from groq import Groq

client = Groq(api_key="")

def tts_to_wav_file(text: str, filename: str) -> None:
    resp = client.audio.speech.create(
        model="playai-tts",
        voice="Fritz-PlayAI",
        input=text,
        response_format="wav",
    )
    # у объекта ответа есть удобный метод:
    resp.write_to_file(filename)

if __name__ == "__main__":
    tts_to_wav_file(
        "Привет! Это тест озвучки напрямую через Groq SDK.",
        "simple_tts.wav",
    )
    print("Готово: simple_tts.wav")
