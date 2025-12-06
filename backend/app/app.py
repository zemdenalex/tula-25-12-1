import json
import time
import logging
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, APIRouter, Request, Response, Query, File, UploadFile, Request
from fastapi import Request as FastAPIRequest
from starlette.middleware.cors import CORSMiddleware as cors

import os

from db.map import get_all_places, add_place, get_all_types, get_place, search_places, update_place
from db.map import get_all_places, add_place, get_all_types, get_place
from db.user import create_user, login_user, add_review, get_all_users, get_user_by_id, delete_review, set_review_rank
from s3_client import upload_photo
from db.map import get_all_places, add_place, get_all_types, get_place
from db.user import create_user, login_user, add_review, get_all_users, get_user_by_id, delete_review
from db.admin import create_admin, login_admin, update_user_rating, verify_place, ban_user, delete_review_admin


from typing import Dict, Any, Optional, List
from pydantic import BaseModel

logger = logging.getLogger(__name__)

app = FastAPI(root_path="/api")

origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:80",
    "http://localhost:443",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:4173",
    "http://localhost:3000",
    "https://localhost:8000",
]

app.add_middleware(
    cors,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.options("/{path:path}")
async def options_route(path: str, request: Request):
    """Обработка OPTIONS запросов для CORS"""
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
    type: Optional[int] = None  # ID интерфейса для создания/обновления


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


class placeData(BaseModel):
    name: Optional[str] = None
    info: Optional[str] = None
    coord1: Optional[float] = None
    coord2: Optional[float] = None
    type: Optional[int] = None
    food_type: Optional[int] = None
    is_alcohol: Optional[bool] = False
    is_health: Optional[bool] = False
    is_insurance: Optional[bool] = False
    is_nosmoking: Optional[bool] = False
    is_smoke: Optional[bool] = False
    rating: Optional[int] = None
    sport_type: Optional[int] = None
    products: Optional[list[productData]] = None
    equipment: Optional[list[equipmentData]] = None
    ads: Optional[list[equipmentData]] = None


class placeUpdateData(BaseModel):
    info: Optional[str] = None
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
    ads: Optional[list[adsData]] = None


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


@place_router.get("/", response_model=List[placeResponseData])
async def get_all_points_h():
    all_points = await get_all_places()
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
    """
    Изменяет информацию о месте и автоматически пересчитывает рейтинг
    """
    place = data.dict()
    # Удаляем None значения для частичных обновлений
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
    is_moderated: Optional[bool] = Query(True),
    has_product_type: Optional[List[int]] = Query(None),
    has_equipment_type: Optional[List[int]] = Query(None),
    has_ads_type: Optional[List[int]] = Query(None),
    need_products: Optional[bool] = Query(None),
    need_equipment: Optional[bool] = Query(None),
    need_ads: Optional[bool] = Query(None)
):
    """
    Поиск мест по фильтрам:
    - place_type: тип места (ID)
    - is_alcohol, is_health, is_nosmoking, is_smoke: флаги места
    - max_distance: максимальное расстояние до центра Тулы в километрах
    - is_moderated: флаг модерации
    - has_product_type: список ID типов продуктов (можно указать несколько)
    - has_equipment_type: список ID типов оборудования (можно указать несколько)
    - has_ads_type: список ID типов рекламы (можно указать несколько)
    - need_products: загружать ли данные о продуктах (true - загружать, false/None - не загружать)
    - need_equipment: загружать ли данные об оборудовании (true - загружать, false/None - не загружать)
    - need_ads: загружать ли данные о рекламе (true - загружать, false/None - не загружать)
    """
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
        need_ads=need_ads
    )
    return places



app.include_router(place_router, prefix="/place", tags=["place"])

# User router
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


@user_router.post("/create")
async def create_user_h(data: UserCreateData) -> dict:
    """Создает нового пользователя"""
    user_id = await create_user(data.name, data.email, data.password)
    if user_id is None:
        raise HTTPException(status_code=400, detail="User already exists or error occurred")
    return {"user_id": user_id}


@user_router.post("/login")
async def login_user_h(data: UserLoginData) -> dict:
    """Авторизует пользователя"""
    user_id = await login_user(data.email, data.password)
    if user_id is None:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    return {"user_id": user_id}


@user_router.post("/review")
async def add_review_h(data: UserReviewData):
    if not data.message or not data.message.strip():
        raise HTTPException(status_code=418, detail="isNoGoodMessage")
    
    # Проверяем рейтинг (должен быть от 1 до 5)
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    # Добавляем отзыв в БД с фото, если они есть
    photo_urls = data.photos if data.photos else None
    result = await add_review(data.message, data.user_id, data.place_id, data.rating, photo_urls)
    if not result:
        raise HTTPException(status_code=400, detail="error")
    return {"status": "ok"}


@user_router.get("/{id}", response_model=UserResponseData)
async def get_user_h(id: int):
    """Возвращает информацию о пользователе по ID"""
    user = await get_user_by_id(id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@user_router.get("/", response_model=List[UserResponseData])
async def get_all_users_h():
    """Возвращает список всех пользователей"""
    users = await get_all_users()
    return users


@user_router.delete("/review")
async def delete_review_h(data: UserDeleteReviewData):
    """Удаляет отзыв"""
    result = await delete_review(data.user_id, data.review_id)
    if result == 'not_author':
        raise HTTPException(status_code=418, detail="ты не автор")
    elif result == 'error':
        raise HTTPException(status_code=400, detail="some err")
    return {"status": "ok"}


app.include_router(user_router, prefix="/user", tags=["user"])

# Review rank router
review_router = APIRouter()


@review_router.post("/rank")
async def set_review_rank_h(data: ReviewRankData):
    """Устанавливает лайк или дизлайк на отзыв"""
    try:
        # Проверяем, что передан хотя бы один параметр
        if data.like is None and data.dislike is None:
            raise HTTPException(status_code=400, detail="Either like or dislike must be provided")

        # Проверяем, что не переданы оба параметра одновременно как True
        if data.like is True and data.dislike is True:
            raise HTTPException(status_code=400, detail="Cannot set both like and dislike to true")

        result = await set_review_rank(data.user_id, data.review_id, data.like, data.dislike)
        if not result:
            logger.error(f"Failed to set review rank: user_id={data.user_id}, review_id={data.review_id}, like={data.like}, dislike={data.dislike}")
            raise HTTPException(status_code=400, detail="error")
        return {"status": "ok"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in set_review_rank_h: {e}")
        raise HTTPException(status_code=400, detail=f"error: {str(e)}")


app.include_router(review_router, prefix="/review", tags=["review"])

# Photo router
photo_router = APIRouter()


@photo_router.post("/upload")
async def upload_photo_h(request: FastAPIRequest):
    """Загружает фото в MinIO и возвращает presigned URL для просмотра"""
    try:
        # Читаем бинарные данные из тела запроса
        file_data = await request.body()

        if not file_data:
            raise HTTPException(status_code=400, detail="No file data provided")

        # Определяем расширение файла из Content-Type заголовка
        content_type = request.headers.get("content-type", "").lower()

        # Маппинг MIME типов в расширения файлов
        mime_to_extension = {
            "image/png": "png",
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/gif": "gif",
            "image/webp": "webp",
            "image/bmp": "bmp",
            "image/svg+xml": "svg",
        }

        # Определяем расширение из Content-Type или используем jpg по умолчанию
        file_extension = mime_to_extension.get(content_type, "jpg")

        # Загружаем в MinIO и получаем URL
        photo_url = upload_photo(file_data, file_extension)

        return {"url": photo_url}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading photo: {e}")
        raise HTTPException(status_code=400, detail=f"Error uploading photo: {str(e)}")


@photo_router.options("/upload")
async def upload_photo_options():
    """Обработка OPTIONS запроса для CORS"""
    return Response(status_code=204)


app.include_router(photo_router, prefix="/photo", tags=["photo"])

# Admin router
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
    """Создает нового админа другим админом"""
    admin_id = await create_admin(data.id_invite, data.name, data.email, data.password)
    if admin_id is None:
        raise HTTPException(status_code=400, detail="Admin creation failed: invite admin not found or email already exists")
    return {"id": admin_id}


@admin_router.post("/login")
async def login_admin_h(data: AdminLoginData) -> dict:
    """Вход в учетную запись админа"""
    admin_id = await login_admin(data.email, data.pwd)
    if admin_id is None:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    return {"id": admin_id}


@admin_router.put("/user")
async def update_user_rating_h(data: AdminUpdateUserData) -> dict:
    """Уменьшает/увеличивает рейтинг пользователя"""
    result = await update_user_rating(data.id_user, data.rating)
    if not result:
        raise HTTPException(status_code=400, detail="User not found or update failed")
    return {}


@admin_router.put("/place")
async def verify_place_h(data: AdminVerifyPlaceData) -> dict:
    """Помечает поле верификации места значением параметра"""
    result = await verify_place(data.id_place, data.verify)
    if not result:
        raise HTTPException(status_code=400, detail="Place not found or update failed")
    return {}


@admin_router.delete("/user/{id}")
async def ban_user_h(id: int) -> dict:
    """Забанить юзера, установить соответствующие параметры в БД"""
    result = await ban_user(id)
    if not result:
        raise HTTPException(status_code=400, detail="User not found or ban failed")
    return {}


@admin_router.delete("/review")
async def delete_review_admin_h(data: AdminDeleteReviewData) -> dict:
    """Удалить отзыв на место, с возможностью (не обязательной) изменить рейтинг авто"""
    result = await delete_review_admin(data.id_review, data.rating)
    if not result:
        raise HTTPException(status_code=400, detail="Review not found or delete failed")
    return {}


app.include_router(admin_router, prefix="/admin", tags=["admin"])
