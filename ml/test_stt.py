import asyncio
import os

import sounddevice as sd
from videosdk.agents import STTResponse, SpeechEventType

from groq_stt import GroqSTT  # тут импортируем твой класс


async def main():
    # 1. Создаём STT
    stt = GroqSTT(
        api_key="",   # можно явно строку, но так безопаснее
        model="whisper-large-v3",
        language="ru",                       # или "en", "auto" и т.п.
        silence_threshold=0.01,
        silence_duration=0.4,
    )

    loop = asyncio.get_running_loop()

    # 2. Колбэк, который будет получать результаты распознавания
    async def on_transcript(resp: STTResponse):
        if resp.event_type == SpeechEventType.FINAL:
            print(f"\n[FINAL] {resp.data.text}")
        elif resp.event_type == SpeechEventType.INTERIM:
            # у тебя сейчас только FINAL, но на будущее оставлю
            print(f"\r[INTERIM] {resp.data.text}", end="", flush=True)

    # BaseSTT внутри использует self._transcript_callback, так что просто задаём его
    stt._transcript_callback = on_transcript  # если есть официальный setter — используй его

    # 3. Колбэк от sounddevice: берём фреймы с микрофона и кидаем в STT
    def audio_callback(indata, frames, time_info, status):
        # indata: (frames, channels) int16 @ 48000 Hz
        if status:
            print("Audio status:", status)
        audio_bytes = indata.tobytes()
        # отправляем корутину process_audio в event loop
        asyncio.run_coroutine_threadsafe(
            stt.process_audio(audio_bytes),
            loop,
        )

    # 4. Настраиваем поток с микрофона
    stream = sd.InputStream(
        samplerate=48000,
        channels=2,          # в твоём GroqSTT логика VAD рассчитана на 2 канала (len/4)
        dtype="int16",
        callback=audio_callback,
    )

    print("Говорите в микрофон. Нажмите Ctrl+C, чтобы выйти.\n")

    # 5. Запускаем поток и держим цикл событий
    with stream:
        try:
            while True:
                await asyncio.sleep(0.1)
        except KeyboardInterrupt:
            print("\nОстанавливаемся...")
        finally:
            await stt.aclose()


if __name__ == "__main__":
    asyncio.run(main())
