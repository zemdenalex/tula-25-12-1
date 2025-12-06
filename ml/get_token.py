import uuid
import requests

AUTH_KEY = "MDE5YWJmYTYtYjg3Ny03MmExLTk5YzgtYjYzNjE0MzAyN2VjOjY3M2Q3OTkwLTIyZjEtNDUxNC04MzNkLWExZTE4ZTNmODZlNA=="  # Base64, НЕ client_id и НЕ access_token
SCOPE = "GIGACHAT_API_B2B"

url = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"

headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept": "application/json",
    "Authorization": f"Basic {AUTH_KEY}",
    "RqUID": str(uuid.uuid4()),  # uuid4 как в доке
}

data = {
    "scope": SCOPE,
}

response = requests.post(url, headers=headers, data=data, verify=False)  # verify=False только для тестов!

print(response.status_code, response.text)

if response.status_code == 200:
    token = response.json()["access_token"]
    print("TOKEN:", token)
else:
    # тут будет как раз ваш 401 и текст ошибки от GigaChat
    raise SystemExit("Не удалось получить токен")
