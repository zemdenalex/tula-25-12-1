import json
import time
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, APIRouter, Request, Response
from starlette.middleware.cors import CORSMiddleware as cors

import os
from db.map import get_all_places, add_place, get_all_types

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


app.include_router(place_router, prefix="/place", tags=["place"])
