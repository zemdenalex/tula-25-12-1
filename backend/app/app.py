import base64
import json
import logging
import mimetypes
from typing import Optional, List

import requests
from fastapi import FastAPI, HTTPException, APIRouter, Response, Query, Request
from fastapi import Request as FastAPIRequest
from openai import OpenAI
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware as cors

import config
from db.admin import create_admin, login_admin, update_user_rating, verify_place, ban_user, delete_review_admin
from db.map import get_all_places, add_place, get_all_types, get_place
from db.map import search_places, update_place
from db.user import create_user, login_user, add_review, get_all_users, get_user_by_id, delete_review, get_leaderboard
from db.user import set_review_rank, add_follow, get_followed_reviews, update_user
from s3_client import upload_photo

logger = logging.getLogger(__name__)

app = FastAPI(root_path="/api")

origins = [
    "*",
#     "http://localhost.tiangolo.com",
#     "https://localhost.tiangolo.com",
#     "http://localhost",
#     "http://localhost:8080",
#     "http://localhost:80",
#     "http://localhost:443",
#     "http://localhost:5173",
#     "http://localhost:5174",
#     "http://localhost:4173",
#     "http://localhost:3000",
#     "https://localhost:8000",
]

app.add_middleware(
    cors,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENROUTER_API_KEY = config.OPENROUTER_API_KEY

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)


def classify_toxic_review(text: str) -> int:
    if not text or not text.strip():
        return 0

    system_prompt = (
        "Ты классификатор токсичных сообщений.\n"
        "Определи, является ли текст токсичным.\n\n"
        "Токсичный текст — это оскорбления, угрозы, грубый мат, унижение личности "
        "или групп людей, явная агрессия и ненависть.\n\n"
        "Если текст токсичный — ответь числом 1.\n"
        "Если текст НЕ токсичный — ответь числом 0.\n"
        "Ответь ТОЛЬКО одной цифрой 0 или 1, без комментариев."
    )

    user_prompt = f'Текст отзыва: """{text}"""'

    completion = client.chat.completions.create(
        model="openai/gpt-4.1-nano",
        temperature=0,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    content = (completion.choices[0].message.content or "").strip()

    if content.startswith("1"):
        return 1
    if content.startswith("0"):
        return 0
    return 0


@app.options("/{path:path}")
async def options_route(path: str, request: Request):
    return Response(status_code=204)


place_router = APIRouter()


class productData(BaseModel):
    id: Optional[int] = None
    type: Optional[str] = None
    name: str
    min_cost: Optional[float] = None
    is_health: Optional[bool] = None
    is_alcohol: Optional[bool] = None
    is_smoking: Optional[bool] = None


class equipmentData(BaseModel):
    name: Optional[str] = None
    count: Optional[int] = None
    type: Optional[int] = None


class adsData(BaseModel):
    id: Optional[int] = None
    type: Optional[str] = None
    name: str
    is_health: Optional[bool] = None


class reviewData(BaseModel):
    id: Optional[int] = None
    id_user: Optional[int] = None
    user_name: Optional[str] = None
    id_place: Optional[int] = None
    text: Optional[str] = None
    review_photos: List[str] = []
    like: Optional[int] = 0
    dislike: Optional[int] = 0
    rating: Optional[int] = None


class placeData(BaseModel):
    id_user: int
    name: Optional[str] = None
    info: Optional[str] = None
    coord1: Optional[float] = None
    coord2: Optional[float] = None
    type: Optional[int] = None
    food_type: Optional[int] = None
    is_alcohol: Optional[bool] = None
    is_health: Optional[bool] = None
    is_insurance: Optional[bool] = None
    is_nosmoking: Optional[bool] = None
    is_smoke: Optional[bool] = None
    rating: Optional[int] = None
    sport_type: Optional[int] = None
    products: Optional[list[productData]] = None
    equipment: Optional[list[equipmentData]] = None
    ads: Optional[list[equipmentData]] = None
    photos: Optional[List[str]] = None


class placeResponseData(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    info: Optional[str] = None
    coord1: float
    coord2: float
    type: Optional[str] = None
    food_type: Optional[str] = None
    is_alcohol: Optional[bool] = None
    is_health: Optional[bool] = None
    is_insurance: Optional[bool] = None
    is_nosmoking: Optional[bool] = None
    is_smoke: Optional[bool] = None
    rating: Optional[int] = None
    sport_type: Optional[str] = None
    distance_to_center: Optional[float] = None
    is_moderated: Optional[bool] = None
    review_rank: Optional[float] = None
    products: list[productData] = []
    equipment: list[equipmentData] = []
    ads: list[adsData] = []
    reviews: list[reviewData] = []
    photos: List[str] = []


@place_router.get("/", response_model=List[placeResponseData])
async def get_all_points_h(
        limit: Optional[int] = Query(None),
        offset: Optional[int] = Query(None),
        page: Optional[int] = Query(None)
):
    all_points = await get_all_places(limit=limit, offset=offset, page=page)
    if not all_points:
        raise HTTPException(status_code=418, detail="i am a teapot ;)")
    return all_points


@place_router.get("/point/{id}")
async def get_point_h(id: int):
    point = await get_place(id)
    if not point:
        raise HTTPException(status_code=418, detail="i am a teapot ;)")
    return point


@place_router.get("/types")
async def get_all_types_h():
    all_types = await get_all_types()
    if not all_types:
        raise HTTPException(status_code=418, detail="i am a teapot ;)")
    return all_types


@place_router.post("/")
async def add_point_h(data: placeData) -> int:
    place = data.dict()
    id = await add_place(place)
    if id is None:
        raise HTTPException(status_code=418, detail="i am a teapot ;)")
    return id


@place_router.post("/change/{id}")
async def change_place_h(id: int, data: placeData):
    place = data.dict()
    place = {k: v for k, v in place.items() if v is not None}
    result = await update_place(id, place)
    if not result:
        raise HTTPException(status_code=418, detail="i am a teapot ;)")
    return {"success": True, "message": f"Information updated for place {id}"}


@place_router.get("/search", response_model=List[placeResponseData])
async def search_places_h(
        place_type: Optional[int] = Query(None),
        is_alcohol: Optional[bool] = Query(None),
        is_health: Optional[bool] = Query(None),
        is_nosmoking: Optional[bool] = Query(None),
        is_smoke: Optional[bool] = Query(None),
        max_distance: Optional[float] = Query(5),
        is_moderated: Optional[bool] = Query(None),
        has_product_type: Optional[List[int]] = Query(None),
        has_equipment_type: Optional[List[int]] = Query(None),
        has_ads_type: Optional[List[int]] = Query(None),
        need_products: Optional[bool] = Query(None),
        need_equipment: Optional[bool] = Query(None),
        need_ads: Optional[bool] = Query(None),
        limit: Optional[int] = Query(None),
        offset: Optional[int] = Query(None),
        page: Optional[int] = Query(None)
):
    places = await search_places(
        place_type=place_type,
        is_alcohol=is_alcohol,
        is_health=is_health,
        is_nosmoking=is_nosmoking,
        is_smoke=is_smoke,
        max_distance=max_distance,
        is_moderated=is_moderated,
        has_product_type=has_product_type,
        has_equipment_type=has_equipment_type,
        has_ads_type=has_ads_type,
        need_products=need_products,
        need_equipment=need_equipment,
        need_ads=need_ads,
        limit=limit,
        offset=offset,
        page=page
    )
    return places


app.include_router(place_router, prefix="/place", tags=["place"])

user_router = APIRouter()


class UserCreateData(BaseModel):
    name: str
    email: str
    password: str


class UserLoginData(BaseModel):
    email: str
    password: str


class UserReviewData(BaseModel):
    message: str
    user_id: int
    place_id: int
    rating: int
    photos: Optional[List[str]] = None


class UserResponseData(BaseModel):
    user_id: int
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    photo: Optional[str] = None
    rating: Optional[int] = None


class UserDeleteReviewData(BaseModel):
    user_id: int
    review_id: int


class ReviewRankData(BaseModel):
    user_id: int
    review_id: int
    like: Optional[bool] = None
    dislike: Optional[bool] = None


class UserUpdateData(BaseModel):
    user_id: int
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    rating: Optional[int] = None
    phone: Optional[str] = None
    photo: Optional[str] = None


class FollowData(BaseModel):
    user_id: int
    follow_id: int


@user_router.post("/create")
async def create_user_h(data: UserCreateData) -> dict:
    user_id = await create_user(data.name, data.email, data.password)
    if user_id is None:
        raise HTTPException(status_code=400, detail="User already exists or error occurred")
    return {"user_id": user_id}


@user_router.post("/login")
async def login_user_h(data: UserLoginData) -> dict:
    user_id = await login_user(data.email, data.password)
    if user_id is None:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    return {"user_id": user_id}


@user_router.post("/review")
async def add_review_h(data: UserReviewData):
    if not data.message or not data.message.strip():
        raise HTTPException(status_code=418, detail="isNoGoodMessage")

    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=401, detail="Rating must be between 1 and 5")

    toxic = classify_toxic_review(data.message)
    if toxic:
        raise HTTPException(status_code=418, detail="isNoGoodMessage")

    photo_urls = data.photos if data.photos else None
    result = await add_review(data.message, data.user_id, data.place_id, data.rating, photo_urls)
    if not result:
        raise HTTPException(status_code=400, detail="error")
    return {"status": "ok"}


@user_router.get("/{id}", response_model=UserResponseData)
async def get_user_h(id: int):
    user = await get_user_by_id(id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@user_router.get("/", response_model=List[UserResponseData])
async def get_all_users_h(
        limit: Optional[int] = Query(None),
        offset: Optional[int] = Query(None),
        page: Optional[int] = Query(None)
):
    users = await get_all_users(limit=limit, offset=offset, page=page)
    return users


@user_router.delete("/review")
async def delete_review_h(data: UserDeleteReviewData):
    result = await delete_review(data.user_id, data.review_id)
    if result == 'not_author':
        raise HTTPException(status_code=418, detail="ты не автор")
    elif result == 'error':
        raise HTTPException(status_code=400, detail="some err")
    return {"status": "ok"}


@user_router.put("/update")
async def update_user_h(data: UserUpdateData):
    user_data = data.dict()
    user_id = user_data.pop('user_id')

    user_data = {k: v for k, v in user_data.items() if v is not None}

    result = await update_user(user_id, user_data)
    if not result:
        raise HTTPException(status_code=400, detail="User not found or update failed")
    return {"success": True, "message": f"Information updated for user {user_id}"}


app.include_router(user_router, prefix="/users", tags=["user"])


@user_router.post("/follow/")
async def add_follow_h(data: FollowData):
    result = await add_follow(data.user_id, data.follow_id)
    if not result:
        raise HTTPException(status_code=400,
                            detail="Failed to add follow. User may not exist, already following, or trying to follow self")
    return {"status": "ok"}


@user_router.get("/follow/{user_id}", response_model=List[reviewData])
async def get_followed_reviews_h(
        user_id: int,
        limit: Optional[int] = Query(None),
        offset: Optional[int] = Query(None),
        page: Optional[int] = Query(None)
):
    reviews = await get_followed_reviews(user_id, limit=limit, offset=offset, page=page)
    return reviews


app.include_router(user_router, prefix="/user", tags=["user"])

review_router = APIRouter()


@review_router.post("/rank")
async def set_review_rank_h(data: ReviewRankData):
    try:
        if data.like is None and data.dislike is None:
            raise HTTPException(status_code=400, detail="Either like or dislike must be provided")

        if data.like is True and data.dislike is True:
            raise HTTPException(status_code=400, detail="Cannot set both like and dislike to true")

        result = await set_review_rank(data.user_id, data.review_id, data.like, data.dislike)
        if not result:
            logger.error(
                f"Failed to set review rank: user_id={data.user_id}, review_id={data.review_id}, like={data.like}, dislike={data.dislike}")
            raise HTTPException(status_code=400, detail="error")
        return {"status": "ok"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in set_review_rank_h: {e}")
        raise HTTPException(status_code=400, detail=f"error: {str(e)}")


app.include_router(review_router, prefix="/review", tags=["review"])

photo_router = APIRouter()


@photo_router.post("/upload")
async def upload_photo_h(request: FastAPIRequest):
    try:
        file_data = await request.body()

        if not file_data:
            raise HTTPException(status_code=403, detail="No file data provided")

        content_type = request.headers.get("content-type", "").lower()

        mime_to_extension = {
            "image/png": "png",
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/gif": "gif",
            "image/webp": "webp",
            "image/bmp": "bmp",
            "image/svg+xml": "svg",
        }

        file_extension = mime_to_extension.get(content_type, "jpg")

        photo_url = upload_photo(file_data, file_extension)

        moderation = moderate_image_by_url(photo_url)

        if moderation not in [1, 2]:
            return HTTPException(status_code=402, detail="Photo upload failed")

        if moderation == 1:
            return HTTPException(status_code=401, detail="Photo not moderation")

        return {"url": photo_url}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading photo: {e}")
        raise HTTPException(status_code=400, detail=f"Error uploading photo: {str(e)}")


@photo_router.options("/upload")
async def upload_photo_options():
    return Response(status_code=204)


app.include_router(photo_router, prefix="/photo", tags=["photo"])

admin_router = APIRouter()


class AdminCreateData(BaseModel):
    id_invite: int
    name: str
    email: str
    password: str


class AdminLoginData(BaseModel):
    email: str
    pwd: str


class AdminUpdateUserData(BaseModel):
    id_user: int
    rating: int


class AdminVerifyPlaceData(BaseModel):
    id_place: int
    verify: bool


class AdminDeleteReviewData(BaseModel):
    id_review: int
    rating: Optional[int] = None


@admin_router.post("/create")
async def create_admin_h(data: AdminCreateData) -> dict:
    admin_id = await create_admin(data.id_invite, data.name, data.email, data.password)
    if admin_id is None:
        raise HTTPException(status_code=400,
                            detail="Admin creation failed: invite admin not found or email already exists")
    return {"id": admin_id}


@admin_router.post("/login")
async def login_admin_h(data: AdminLoginData) -> dict:
    admin_id = await login_admin(data.email, data.pwd)
    if admin_id is None:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    return {"id": admin_id}


@admin_router.put("/user")
async def update_user_rating_h(data: AdminUpdateUserData) -> dict:
    result = await update_user_rating(data.id_user, data.rating)
    if not result:
        raise HTTPException(status_code=400, detail="User not found or update failed")
    return {}


@admin_router.put("/place")
async def verify_place_h(data: AdminVerifyPlaceData) -> dict:
    result = await verify_place(data.id_place, data.verify)
    if not result:
        raise HTTPException(status_code=400, detail="Place not found or update failed")
    return {}


@admin_router.delete("/user/{id}")
async def ban_user_h(id: int) -> dict:
    result = await ban_user(id)
    if not result:
        raise HTTPException(status_code=400, detail="User not found or ban failed")
    return {}


@admin_router.delete("/review")
async def delete_review_admin_h(data: AdminDeleteReviewData) -> dict:
    result = await delete_review_admin(data.id_review, data.rating)
    if not result:
        raise HTTPException(status_code=400, detail="Review not found or delete failed")
    return {}


app.include_router(admin_router, prefix="/admin", tags=["admin"])

leader_router = APIRouter()


@leader_router.get("/")
async def get_leaderboard_h():
    try:
        result = await get_leaderboard()
        if not result:
            logger.error(f"Failed to get leaderboard")
            raise HTTPException(status_code=400, detail="error")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in set_review_rank_h: {e}")
        raise HTTPException(status_code=400, detail=f"error: {str(e)}")


app.include_router(leader_router, prefix="/leaderboard", tags=["leaderboard"])

OPENROUTER_API_KEY = config.OPENROUTER_API_KEY


def image_bytes_to_data_url(data: bytes, fallback_ext: str = "jpg") -> str:
    mime_type = mimetypes.guess_type(f"file.{fallback_ext}")[0] or "image/jpeg"
    b64 = base64.b64encode(data).decode("utf-8")
    return f"data:{mime_type};base64,{b64}"


def moderate_image_by_url(image_url: str) -> int:
    api_key = OPENROUTER_API_KEY
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY не задан")

    resp = requests.get(image_url)
    resp.raise_for_status()
    image_bytes = resp.content

    content_type = resp.headers.get("Content-Type", "").lower()
    ext = "jpg"
    if "png" in content_type:
        ext = "png"
    elif "webp" in content_type:
        ext = "webp"
    elif "gif" in content_type:
        ext = "gif"

    image_data_url = image_bytes_to_data_url(image_bytes, fallback_ext=ext)

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    prompt_text = (
        "Проанализируй это изображение по следующим критериям и ответь, "
        "нарушен ли какой-то из пунктов ниже:\n\n"
        "1) Есть ли на изображении контент 18+ (обнажёнка, порнография, сексуальные позы, "
        "явно сексуализированная одежда/фетиш, любые сцены сексуального характера).\n"
        "2) Есть ли на изображении оружие (огнестрельное, холодное, взрывчатка, реалистичные макеты).\n"
        "3) Занимает ли полностью фотографию человек в полный рост (видны голова, торс и ноги полностью).\n\n"
        "Если нарушение есть, верни 1.\n"
        "Если нарушений нет, верни 0.\n"
        "ВЕРНИ ТОЛЬКО ЧИСЛО."
    )

    payload = {
        "model": "qwen/qwen2.5-vl-72b-instruct",
        "temperature": 0,
        "messages": [
            {
                "role": "system",
                "content": "Ты модератор контента. Отвечай строго одним числом без лишнего текста.",
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt_text,
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_data_url,
                        },
                    },
                ],
            },
        ],
    }

    response = requests.post(url, headers=headers, data=json.dumps(payload))
    if response.status_code != 200:
        raise RuntimeError(f"OpenRouter API error: {response.status_code} {response.text}")

    data = response.json()

    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as e:
        raise RuntimeError(f"Unexpected response format: {data}") from e

    content_stripped = str(content).strip()

    if content_stripped not in ("0", "1"):
        raise RuntimeError(f"Unexpected model output (expected '0' or '1'): {content_stripped}")

    return int(content_stripped)


def ask_gpt(text: str) -> str:
    completion = client.chat.completions.create(
        model="openai/gpt-4.1-nano",
        messages=[
            {
                "role": "user",
                "content": text,
            }
        ],
    )
    return completion.choices[0].message.content.strip()


gpt_router = APIRouter()


class GPTRequest(BaseModel):
    text: str


class GPTResponse(BaseModel):
    answer: str


@gpt_router.post("/chat", response_model=GPTResponse)
async def gpt_chat_h(data: GPTRequest):
    if not data.text or not data.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty")

    try:
        answer = ask_gpt(data.text)
        return GPTResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GPT error: {str(e)}")


app.include_router(gpt_router, prefix="/gpt", tags=["gpt"])
