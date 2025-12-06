import json
import time
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, APIRouter, Request, Response
from starlette.middleware.cors import CORSMiddleware as cors

import os
from db.map import get_all_places, add_place, get_all_types

from typing import Dict, Any
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
    type: int
    name: str
    min_cost: int
    is_health: bool
    is_alcohol: bool
    is_smoking: bool


class equipmentData(BaseModel):
    type: int
    count: int


class adsData(BaseModel):
    type: int
    name: str
    is_health: bool


class placeData(BaseModel):
    name: str
    info: str
    coord1: float
    coord2: float
    type: int
    food_type: int
    is_alcohol: bool
    is_health: bool
    is_insurance: bool
    is_nosmoking: bool
    is_smoke: bool
    rating: int
    sport_type: int
    products: list[productData]
    equipment: list[equipmentData]
    ads: list[equipmentData]


@place_router.get("/")
async def get_all_points_h()-> Dict[str, Any]:
    all_points = await get_all_places()
    if not all_points:
        raise HTTPException(status_code=418, detail="i am a teapot ;)")
    return all_points


@place_router.get("/types")
async def get_all_types_h()-> Dict[str, Any]:
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
