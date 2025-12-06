import json
import time
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, APIRouter, Request, Response, Query
from starlette.middleware.cors import CORSMiddleware as cors

import os
from db.map import get_all_places, add_place, get_all_types, get_place, update_place_info
from db.user import create_user, login_user, add_review, get_all_users, get_user_by_id, delete_review

from typing import Dict, Any, Optional, List
from typing import Dict, Any, Optional, List
from pydantic import BaseModel

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
async def options_route(path: str):
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


class placeData(BaseModel):
    name: Optional[str] = None
    info: Optional[str] = None
    coord1: float
    coord2: float
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



@place_router.get("/{id}")
async def get_point_h(id: int):
    point = await get_place(id)
    if not point:
        raise HTTPException(status_code=418, detail="i am a teapot ;)")
    return point

@place_router.get("/forcreate/types")
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


@place_router.post("/add/{id}")
async def add_place_info_h(id: int, data: placeUpdateData):
    place = data.dict()
    # Remove None values to allow partial updates
    place = {k: v for k, v in place.items() if v is not None}
    result = await update_place_info(id, place)
    if not result:
        raise HTTPException(status_code=418, detail="i am a teapot ;)")
    return {"success": True, "message": f"Information added to place {id}"}


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
    """Добавляет отзыв"""
    # Проверяем, что сообщение не пустое
    if not data.message or not data.message.strip():
        raise HTTPException(status_code=418, detail="isNoGoodMessage")
    
    result = await add_review(data.message, data.user_id, data.place_id)
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
