from test_coqui import tts

tts.tts_to_file(text="Привет. Озвучь мне этот текст.",
                file_path="output.wav",
                speaker_wav=["test_mic.wav"],
                language="ru")