import sounddevice as sd
import soundfile as sf

fs = 48000
duration = 5  # секунд

print("Запись 5 секунд... Говори в микрофон.")
audio = sd.rec(int(duration * fs), samplerate=fs, channels=1, dtype="int16")
sd.wait()
sf.write("test_mic.wav", audio, fs)
print("Сохранено в test_mic.wav")
