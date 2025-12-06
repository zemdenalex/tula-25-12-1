import json
import time
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, APIRouter, Request, Response, Query
from starlette.middleware.cors import CORSMiddleware as cors

import os
from db.map import get_all_places, add_place, get_all_types, get_place, search_places, update_place

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
