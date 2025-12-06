from gigachat import GigaChat

giga = GigaChat(
   credentials="MDE5YWJmYTYtYjg3Ny03MmExLTk5YzgtYjYzNjE0MzAyN2VjOjY3M2Q3OTkwLTIyZjEtNDUxNC04MzNkLWExZTE4ZTNmODZlNA==",
   verify_ssl_certs=False,
   model="GigaChat-Pro",
)

response = giga.chat("Расскажи о себе в двух словах?")

print(response.choices[0].message.content)