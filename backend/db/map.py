import hashlib
import time
from datetime import datetime, timedelta
from typing import Optional, List

import psycopg2
from psycopg2 import sql
import logging

import config as config
from db.migration import db_connection, db_config

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)


async def get_all_places(limit: Optional[int] = None, offset: Optional[int] = None, page: Optional[int] = None) -> list:
    connection = db_connection()
    cursor = connection.cursor()

    try:
        base_query = """
SELECT p.id, p.name, p.coord1, p.coord2, pt.type, ft.type,
    p.isalcohol, p.ishealth, p.isinsurence, p.isnosmoking, p.issmoke, p.rating, st.type, p.info
FROM places p
LEFT JOIN places_type pt ON p.type = pt.id
LEFT JOIN food_type ft ON p.foodtype = ft.id
LEFT JOIN sport_type st ON st.id = p.sporttype
        """
        
        # Добавляем LIMIT и OFFSET если они указаны
        if limit is not None:
            if offset is not None and page is not None:
                calculated_offset = offset * page
                base_query += f" LIMIT {limit} OFFSET {calculated_offset}"
            elif offset is not None:
                base_query += f" LIMIT {limit} OFFSET {offset}"
            else:
                base_query += f" LIMIT {limit}"
        
        # Выполняем запрос напрямую, так как LIMIT/OFFSET не могут быть параметрами
        cursor.execute(base_query)

        rows = cursor.fetchall()
        places = []
        for row in rows:
            id = row[0]

            query_product = sql.SQL("""
            SELECT id, (SELECT product_type.type from product_type where product_type.id = product.type),
            min_cost, ishealth, isalcohol, issmoking, name 
            from product where id_place = %s
            """)
            cursor.execute(query_product, (id,))
            rows_product = cursor.fetchall()
            products = []
            for row_p in rows_product:
                product = {
                    "id": row_p[0],
                    "type": row_p[1],
                    "min_cost": row_p[2],
                    "is_health": row_p[3],
                    "is_alcohol": row_p[4],
                    "is_smoking": row_p[5],
                    "name": row_p[6]
                }
                products.append(product)
            query_ads = sql.SQL("""
                        SELECT id, (SELECT reklama_type.type from reklama_type where reklama_type.id = reklama.type),
                        name, ishelth 
                        from reklama where id_place = %s
                        """)
            cursor.execute(query_ads, (id,))
            rows_ads = cursor.fetchall()
            ads = []
            for row_a in rows_ads:
                ad = {
                    "id": row_a[0],
                    "type": row_a[1],
                    "name": row_a[2],
                    "is_health": row_a[3],
                }
                ads.append(ad)

            query_review = sql.SQL(
                """SELECT id, iduser, (SELECT users.name from users where users.id = reviews.iduser), idplace, text 
                from reviews where idplace=%s"""

            )

            cursor.execute(query_review, (id,))
            rows_review = cursor.fetchall()
            reviews = []
            for row_r in rows_review:
                review_id = row_r[0]
                # Получаем фото для этого отзыва
                query_photos = sql.SQL("""
                    SELECT url FROM reviews_photo WHERE review_id = %s
                """)
                cursor.execute(query_photos, (review_id,))
                rows_photos = cursor.fetchall()
                review_photos = [row_photo[0] for row_photo in rows_photos]
                
                # Получаем количество лайков и дизлайков
                query_ranks = sql.SQL("""
                    SELECT 
                        COUNT(*) FILTER (WHERE "like" = true) as like_count,
                        COUNT(*) FILTER (WHERE dislike = true) as dislike_count
                    FROM reviews_ranks 
                    WHERE review_id = %s
                """)
                cursor.execute(query_ranks, (review_id,))
                ranks_row = cursor.fetchone()
                like_count = ranks_row[0] if ranks_row else 0
                dislike_count = ranks_row[1] if ranks_row else 0
                
                review = {
                    "id": review_id,
                    "id_user": row_r[1],
                    "user_name": row_r[2],
                    "id_place": row_r[3],
                    "text": row_r[4],
                    "review_photos": review_photos,
                    "like": like_count,
                    "dislike": dislike_count,
                }
                reviews.append(review)

            query_sport = sql.SQL(
                """SELECT (SELECT type from sport_interfaces as si where si.id = sip.id_interface), count 
                from sport_interfaces_place as sip where id_place = %s"""
            )

            cursor.execute(query_sport, (id,))
            rows_sport = cursor.fetchall()
            sports = []
            for row_s in rows_sport:
                sport = {
                    "name": row_s[0],
                    "count": row_s[1],
                }
                sports.append(sport)

            # Получаем средний рейтинг отзывов для этого места
            query_review_rank = sql.SQL("""
                SELECT COALESCE(AVG(rating)::numeric(10,2), 0)
                FROM reviews 
                WHERE idPlace = %s AND rating IS NOT NULL
            """)
            cursor.execute(query_review_rank, (id,))
            review_rank_row = cursor.fetchone()
            review_rank = float(review_rank_row[0]) if review_rank_row[0] is not None else 0.0

            # Получаем фотографии для этого места
            query_photos = sql.SQL("""
                SELECT url FROM places_photos WHERE place_id = %s
            """)
            cursor.execute(query_photos, (id,))
            rows_photos = cursor.fetchall()
            photos = [row_photo[0] for row_photo in rows_photos]

            place = {"id": row[0], "name": row[1], "coord1": row[2], "coord2": row[3],
                     "type": row[4], "food_type": row[5], "is_alcohol": row[6],
                     "is_health": row[7], "is_insurance": row[8], "is_nosmoking": row[9],
                     "is_smoke": row[10], "rating": row[11], "sport_type": row[12], "info": row[13], "products": products,
                     "ads": ads,
                     "reviews": reviews, "equipment": sports, "review_rank": review_rank, "photos": photos}
            places.append(place)
        return places

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')

async def get_place(id):
    connection = db_connection()
    cursor = connection.cursor()
    out = dict()

    try:
        query = sql.SQL("""
SELECT p.id, p.name, p.coord1, p.coord2, pt.type, ft.type,
    p.isalcohol, p.ishealth, p.isinsurence, p.isnosmoking, p.issmoke, p.rating, st.type, p.info
FROM places p
LEFT JOIN places_type pt ON p.type = pt.id
LEFT JOIN food_type ft ON p.foodtype = ft.id
LEFT JOIN sport_type st ON st.id = p.sporttype WHERE p.id = %s; 
        """)
        cursor.execute(query, (id, ))

        row = cursor.fetchone()
        id = row[0]

        query_product = sql.SQL("""
        SELECT id, (SELECT product_type.type from product_type where product_type.id = product.type),
        min_cost, ishealth, isalcohol, issmoking, name 
        from product where id_place = %s
        """)
        cursor.execute(query_product, (id,))
        rows_product = cursor.fetchall()
        products = []
        for row_p in rows_product:
            product = {
                "id": row_p[0],
                "type": row_p[1],
                "min_cost": row_p[2],
                "is_health": row_p[3],
                "is_alcohol": row_p[4],
                "is_smoking": row_p[5],
                "name": row_p[6]
            }
            products.append(product)
        query_ads = sql.SQL("""
                    SELECT id, (SELECT reklama_type.type from reklama_type where reklama_type.id = reklama.type),
                    name, ishelth 
                    from reklama where id_place = %s
                    """)
        cursor.execute(query_ads, (id,))
        rows_ads = cursor.fetchall()
        ads = []
        for row_a in rows_ads:
            ad = {
                "id": row_a[0],
                "type": row_a[1],
                "name": row_a[2],
                "is_health": row_a[3],
            }
            ads.append(ad)

        query_review = sql.SQL(
            """SELECT id, iduser, (SELECT users.name from users where users.id = reviews.iduser), idplace, text, rating 
            from reviews where idplace=%s"""

        )

        cursor.execute(query_review, (id,))
        rows_review = cursor.fetchall()
        reviews = []
        for row_r in rows_review:
            review_id = row_r[0]
            # Получаем фото для этого отзыва
            query_photos = sql.SQL("""
                SELECT url FROM reviews_photo WHERE review_id = %s
            """)
            cursor.execute(query_photos, (review_id,))
            rows_photos = cursor.fetchall()
            review_photos = [row_photo[0] for row_photo in rows_photos]
            
            # Получаем количество лайков и дизлайков
            query_ranks = sql.SQL("""
                SELECT 
                    COUNT(*) FILTER (WHERE "like" = true) as like_count,
                    COUNT(*) FILTER (WHERE dislike = true) as dislike_count
                FROM reviews_ranks 
                WHERE review_id = %s
            """)
            cursor.execute(query_ranks, (review_id,))
            ranks_row = cursor.fetchone()
            like_count = ranks_row[0] if ranks_row else 0
            dislike_count = ranks_row[1] if ranks_row else 0
            
            review = {
                "id": review_id,
                "id_user": row_r[1],
                "user_name": row_r[2],
                "id_place": row_r[3],
                "text": row_r[4],
                "review_photos": review_photos,
                "like": like_count,
                "dislike": dislike_count,
                "rating": row_r[5],
            }
            reviews.append(review)

        query_sport = sql.SQL(
            """SELECT (SELECT type from sport_interfaces as si where si.id = sip.id_interface), count 
            from sport_interfaces_place as sip where id_place = %s"""
        )

        cursor.execute(query_sport, (id,))
        rows_sport = cursor.fetchall()
        sports = []
        for row_s in rows_sport:
            sport = {
                "name": row_s[0],
                "count": row_s[1],
            }
            sports.append(sport)

        # Получаем средний рейтинг отзывов для этого места
        query_review_rank = sql.SQL("""
            SELECT COALESCE(AVG(rating)::numeric(10,2), 0)
            FROM reviews 
            WHERE idPlace = %s AND rating IS NOT NULL
        """)
        cursor.execute(query_review_rank, (id,))
        review_rank_row = cursor.fetchone()
        review_rank = float(review_rank_row[0]) if review_rank_row[0] is not None else 0.0

        # Получаем фотографии для этого места
        query_photos = sql.SQL("""
            SELECT url FROM places_photos WHERE place_id = %s
        """)
        cursor.execute(query_photos, (id,))
        rows_photos = cursor.fetchall()
        photos = [row_photo[0] for row_photo in rows_photos]

        place = {"id": row[0], "name": row[1], "coord1": row[2], "coord2": row[3],
                 "type": row[4], "food_type": row[5], "is_alcohol": row[6],
                 "is_health": row[7], "is_insurance": row[8], "is_nosmoking": row[9],
                 "is_smoke": row[10], "rating": row[11], "sport_type": row[12], "info": row[13], "products": products,
                 "ads": ads,
                 "reviews": reviews, "equipment": sports, "review_rank": review_rank, "photos": photos}

        return place

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')


async def get_all_types() -> dict:
    connection = db_connection()
    cursor = connection.cursor()
    out = dict()
    try:
        query = sql.SQL("""
SELECT id, type from places_type 
        """)
        cursor.execute(query)

        rows = cursor.fetchall()
        places = []
        for row in rows:
            place = {"id": row[0], "type": row[1]}
            places.append(place)
        out['place_type'] = places

        query = sql.SQL("""
        SELECT id, type from product_type 
                """)
        cursor.execute(query)

        rows = cursor.fetchall()
        products = []
        for row in rows:
            product = {"id": row[0], "type": row[1]}
            products.append(product)
        out['product_type'] = products

        query = sql.SQL("""
        SELECT id, type from reklama_type 
                """)
        cursor.execute(query)

        rows = cursor.fetchall()
        places = []
        for row in rows:
            place = {"id": row[0], "type": row[1]}
            places.append(place)
        out['ads_type'] = places

        query = sql.SQL("""
        SELECT id, type from sport_interfaces 
                """)
        cursor.execute(query)

        rows = cursor.fetchall()
        places = []
        for row in rows:
            place = {"id": row[0], "type": row[1]}
            places.append(place)
        out['equipment_type'] = places

        query = sql.SQL("""
        SELECT id, type from sport_type 
                """)
        cursor.execute(query)

        rows = cursor.fetchall()
        places = []
        for row in rows:
            place = {"id": row[0], "type": row[1]}
            places.append(place)
        out['sport_type'] = places
        return out

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')


async def add_place(place) -> int:
    connection = db_connection()
    cursor = connection.cursor()

    try:
        query = sql.SQL("""
INSERT INTO places 
(name, info, coord1, coord2, type, foodtype, 
isalcohol, ishealth, isinsurence, isnosmoking, issmoke,
rating, sporttype)

VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
returning id; 
        """)
        # rating будет вычислен автоматически после добавления всех данных
        cursor.execute(query, (place['name'], place['info'], place['coord1'], place['coord2'],
                               place['type'], place['food_type'],
                               place['is_alcohol'], place['is_health'], place['is_insurance'],
                               place["is_nosmoking"], place["is_smoke"], None, place["sport_type"]))

        row = cursor.fetchone()
        id = row[0]
        if place['products']:
            query_product = sql.SQL("""
            INSERT INTO product (type, min_cost, ishealth, isalcohol, issmoking, name, id_place) 
            VALUES (%s, %s, %s, %s, %s, %s, %s);
            """)

            for product in place['products']:
                cursor.execute(query_product,
                               (product['type'], product['min_cost'], product['is_health'], product['is_alcohol'],
                                product['is_smoking'], product['name'], id))
        if place['ads']:
            query_ads = sql.SQL("""
                        INSERT INTO reklama (id_place, type, name, ishelth) VALUES (%s, %s, %s, %s);
                        """)
            for ad in place['ads']:
                cursor.execute(query_ads, (id, ad['type'], ad['name'], ad['is_health']))
        if place['equipment']:
            query_sport = sql.SQL(
                """ INSERT INTO sport_interfaces_place (id_place, id_interface, count) VALUES (%s, %s, %s)"""
            )

            for sport in place['equipment']:
                cursor.execute(query_sport, (id, sport['type'], sport['count']))
        
        # Сохраняем фотографии если они предоставлены
        if place.get('photos'):
            query_photo = sql.SQL("""
                INSERT INTO places_photos (place_id, url) VALUES (%s, %s)
            """)
            for photo_url in place['photos']:
                cursor.execute(query_photo, (id, photo_url))
        
        cursor.connection.commit()
        
        # Автоматически пересчитываем рейтинг после создания места
        new_rating = await calculate_health_rating(id)
        update_rating_query = sql.SQL("UPDATE places SET rating = %s WHERE id = %s")
        cursor.execute(update_rating_query, (new_rating, id))
        cursor.connection.commit()
        
        return id

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')



async def calculate_health_rating(place_id: int) -> int:
    """
    Вычисляет рейтинг здорового места (0-100) на основе различных критериев
    """
    connection = db_connection()
    cursor = connection.cursor()
    
    try:
        # Получаем основные флаги места
        query = sql.SQL("""
            SELECT ishealth, isnosmoking, issmoke, isalcohol, isinsurence
            FROM places WHERE id = %s
        """)
        cursor.execute(query, (place_id,))
        row = cursor.fetchone()
        
        if not row:
            return 0
        
        ishealth, isnosmoking, issmoke, isalcohol, isinsurence = row
        # Базовый рейтинг для всех мест
        rating_score = 30
        
        # Базовые критерии места
        if ishealth:
            rating_score += 25
        
        if isnosmoking:
            rating_score += 20
        
        if not issmoke:
            rating_score += 15
        else:
            rating_score -= 5
        
        if not isalcohol:
            rating_score += 15
        else:
            rating_score -= 5
        
        if isinsurence:
            rating_score += 15
        
        # Проверяем наличие здоровых продуктов
        query_products = sql.SQL("""
            SELECT EXISTS(SELECT 1 FROM product WHERE id_place = %s AND ishealth = true)
        """)
        cursor.execute(query_products, (place_id,))
        has_health_products = cursor.fetchone()[0]
        if has_health_products:
            rating_score += 20
        
        # Проверяем наличие оборудования
        query_equipment = sql.SQL("""
            SELECT EXISTS(SELECT 1 FROM sport_interfaces_place WHERE id_place = %s)
        """)
        cursor.execute(query_equipment, (place_id,))
        has_equipment = cursor.fetchone()[0]
        if has_equipment:
            rating_score += 15
        
        # Проверяем наличие здоровой рекламы
        query_ads = sql.SQL("""
            SELECT EXISTS(SELECT 1 FROM reklama WHERE id_place = %s AND ishelth = true)
        """)
        cursor.execute(query_ads, (place_id,))
        has_health_ads = cursor.fetchone()[0]
        if has_health_ads:
            rating_score += 15
        
        # Ограничиваем диапазон от 0 до 100
        rating_score = max(0, min(100, rating_score))
        
        return rating_score
        
    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(f"Ошибка при расчете рейтинга: {error}")
        return 0
    finally:
        if connection:
            cursor.close()
            connection.close()


async def update_place(place_id: int, place_data: dict) -> bool:
    """
    Обновляет информацию о месте и автоматически пересчитывает рейтинг
    """
    connection = db_connection()
    cursor = connection.cursor()

    try:
        # Проверяем существование места
        check_query = sql.SQL("SELECT id FROM places WHERE id = %s")
        cursor.execute(check_query, (place_id,))
        if not cursor.fetchone():
            return False

        # Строим UPDATE запрос динамически
        update_fields = []
        update_values = []
        
        if 'info' in place_data and place_data['info'] is not None:
            update_fields.append("info = %s")
            update_values.append(place_data['info'])
        if 'food_type' in place_data and place_data['food_type'] is not None:
            update_fields.append("foodtype = %s")
            update_values.append(place_data['food_type'])
        if 'is_alcohol' in place_data and place_data['is_alcohol'] is not None:
            update_fields.append("isalcohol = %s")
            update_values.append(place_data['is_alcohol'])
        if 'is_health' in place_data and place_data['is_health'] is not None:
            update_fields.append("ishealth = %s")
            update_values.append(place_data['is_health'])
        if 'is_insurance' in place_data and place_data['is_insurance'] is not None:
            update_fields.append("isinsurence = %s")
            update_values.append(place_data['is_insurance'])
        if 'is_nosmoking' in place_data and place_data['is_nosmoking'] is not None:
            update_fields.append("isnosmoking = %s")
            update_values.append(place_data['is_nosmoking'])
        if 'is_smoke' in place_data and place_data['is_smoke'] is not None:
            update_fields.append("issmoke = %s")
            update_values.append(place_data['is_smoke'])
        if 'sport_type' in place_data and place_data['sport_type'] is not None:
            update_fields.append("sporttype = %s")
            update_values.append(place_data['sport_type'])

        # Обновляем основные поля места
        if update_fields:
            update_query = "UPDATE places SET " + ", ".join(update_fields) + " WHERE id = %s"
            update_values.append(place_id)
            cursor.execute(update_query, tuple(update_values))

        # Добавляем новые продукты если предоставлены
        if 'products' in place_data and place_data['products']:
            query_product = sql.SQL("""
                INSERT INTO product (type, min_cost, ishealth, isalcohol, issmoking, name, id_place) 
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """)
            for product in place_data['products']:
                cursor.execute(query_product,
                             (product.get('type'), product.get('min_cost'), product.get('is_health'),
                              product.get('is_alcohol'), product.get('is_smoking'), product.get('name'), place_id))

        # Добавляем новую рекламу если предоставлена
        if 'ads' in place_data and place_data['ads']:
            query_ads = sql.SQL("""
                INSERT INTO reklama (id_place, type, name, ishelth) VALUES (%s, %s, %s, %s);
            """)
            for ad in place_data['ads']:
                cursor.execute(query_ads, (place_id, ad.get('type'), ad.get('name'), ad.get('is_health')))

        # Добавляем новое оборудование если предоставлено
        if 'equipment' in place_data and place_data['equipment']:
            query_sport = sql.SQL("""
                INSERT INTO sport_interfaces_place (id_place, id_interface, count) VALUES (%s, %s, %s)
            """)
            for sport in place_data['equipment']:
                cursor.execute(query_sport, (place_id, sport.get('type'), sport.get('count')))

        # Обновляем фотографии если они предоставлены (удаляем старые и добавляем новые)
        if 'photos' in place_data and place_data['photos'] is not None:
            # Удаляем все существующие фотографии для этого места
            query_delete_photos = sql.SQL("DELETE FROM places_photos WHERE place_id = %s")
            cursor.execute(query_delete_photos, (place_id,))
            
            # Добавляем новые фотографии
            query_photo = sql.SQL("""
                INSERT INTO places_photos (place_id, url) VALUES (%s, %s)
            """)
            for photo_url in place_data['photos']:
                cursor.execute(query_photo, (place_id, photo_url))

        cursor.connection.commit()
        
        # Автоматически пересчитываем рейтинг после обновления
        new_rating = await calculate_health_rating(place_id)
        update_rating_query = sql.SQL("UPDATE places SET rating = %s WHERE id = %s")
        cursor.execute(update_rating_query, (new_rating, place_id))
        cursor.connection.commit()
        
        return True

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(f"Ошибка при обновлении места: {error}")
        cursor.connection.rollback()
        return False
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')


async def search_places(
    place_type: Optional[int] = None,
    is_alcohol: Optional[bool] = None,
    is_health: Optional[bool] = None,
    is_nosmoking: Optional[bool] = None,
    is_smoke: Optional[bool] = None,
    max_distance: Optional[float] = None,
    is_moderated: Optional[bool] = None,
    has_product_type: Optional[List[int]] = None,
    has_equipment_type: Optional[List[int]] = None,
    has_ads_type: Optional[List[int]] = None,
    need_products: Optional[bool] = None,
    need_equipment: Optional[bool] = None,
    need_ads: Optional[bool] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    page: Optional[int] = None
) -> list:
    """
    Поиск мест по фильтрам:
    - place_type: тип места (ID)
    - is_alcohol, is_health, is_nosmoking, is_smoke: флаги
    - max_distance: максимальное расстояние до центра Тулы (км)
    - is_moderated: флаг модерации
    - has_product_type: список ID типов продуктов
    - has_equipment_type: список ID типов оборудования
    - has_ads_type: список ID типов рекламы
    - need_products: загружать ли данные о продуктах
    - need_equipment: загружать ли данные об оборудовании
    - need_ads: загружать ли данные о рекламе
    """
    connection = db_connection()
    cursor = connection.cursor()

    try:
        # Базовый запрос
        base_query = """
SELECT p.id, p.name, p.coord1, p.coord2, pt.type, ft.type,
    p.isalcohol, p.ishealth, p.isinsurence, p.isnosmoking, p.issmoke, p.rating, st.type, p.info,
    p.distance_to_center, p.is_moderated
FROM places p
LEFT JOIN places_type pt ON p.type = pt.id
LEFT JOIN food_type ft ON p.foodtype = ft.id
LEFT JOIN sport_type st ON st.id = p.sporttype
WHERE p.coord1 IS NOT NULL AND p.coord2 IS NOT NULL
        """
        
        # Строим условия WHERE
        conditions = []
        params = []
        
        if place_type is not None:
            conditions.append("p.type = %s")
            params.append(place_type)
        
        if is_alcohol is not None:
            conditions.append("p.isalcohol = %s")
            params.append(is_alcohol)
        
        if is_health is not None:
            conditions.append("p.ishealth = %s")
            params.append(is_health)
        
        if is_nosmoking is not None:
            conditions.append("p.isnosmoking = %s")
            params.append(is_nosmoking)
        
        if is_smoke is not None:
            conditions.append("p.issmoke = %s")
            params.append(is_smoke)
        
        if max_distance is not None:
            conditions.append("p.distance_to_center <= %s")
            params.append(max_distance)
        
        if is_moderated is not None:
            conditions.append("p.is_moderated = %s")
            params.append(is_moderated)
        
        # Фильтры по типам списков (поддержка множественного выбора)
        if has_product_type is not None and len(has_product_type) > 0:
            placeholders = ','.join(['%s'] * len(has_product_type))
            conditions.append(f"EXISTS (SELECT 1 FROM product WHERE product.id_place = p.id AND product.type IN ({placeholders}))")
            params.extend(has_product_type)
        
        if has_equipment_type is not None and len(has_equipment_type) > 0:
            placeholders = ','.join(['%s'] * len(has_equipment_type))
            conditions.append(f"EXISTS (SELECT 1 FROM sport_interfaces_place WHERE sport_interfaces_place.id_place = p.id AND sport_interfaces_place.id_interface IN ({placeholders}))")
            params.extend(has_equipment_type)
        
        if has_ads_type is not None and len(has_ads_type) > 0:
            placeholders = ','.join(['%s'] * len(has_ads_type))
            conditions.append(f"EXISTS (SELECT 1 FROM reklama WHERE reklama.id_place = p.id AND reklama.type IN ({placeholders}))")
            params.extend(has_ads_type)
        
        # Фильтры по наличию списков
        if need_products is not None:
            if need_products:
                conditions.append("EXISTS (SELECT 1 FROM product WHERE product.id_place = p.id)")
            else:
                conditions.append("NOT EXISTS (SELECT 1 FROM product WHERE product.id_place = p.id)")
        
        if need_equipment is not None:
            if need_equipment:
                conditions.append("EXISTS (SELECT 1 FROM sport_interfaces_place WHERE sport_interfaces_place.id_place = p.id)")
            else:
                conditions.append("NOT EXISTS (SELECT 1 FROM sport_interfaces_place WHERE sport_interfaces_place.id_place = p.id)")
        
        if need_ads is not None:
            if need_ads:
                conditions.append("EXISTS (SELECT 1 FROM reklama WHERE reklama.id_place = p.id)")
            else:
                conditions.append("NOT EXISTS (SELECT 1 FROM reklama WHERE reklama.id_place = p.id)")
        
        # Добавляем условия к запросу
        if conditions:
            base_query += " AND " + " AND ".join(conditions)
        
        # Добавляем LIMIT и OFFSET если они указаны
        if limit is not None:
            if offset is not None and page is not None:
                calculated_offset = offset * page
                base_query += f" LIMIT {limit} OFFSET {calculated_offset}"
            elif offset is not None:
                base_query += f" LIMIT {limit} OFFSET {offset}"
            else:
                base_query += f" LIMIT {limit}"
        
        # Выполняем запрос напрямую, так как LIMIT/OFFSET не могут быть параметрами
        logger.debug(f"Executing query: {base_query[:200]}... with params: {params}")
        cursor.execute(base_query, tuple(params))
        
        rows = cursor.fetchall()
        logger.debug(f"Found {len(rows)} rows")
        places = []
        for row in rows:
            id = row[0]

            # Получаем продукты только если нужно
            products = []
            if need_products is True:
                query_product = sql.SQL("""
                SELECT id, (SELECT product_type.type from product_type where product_type.id = product.type),
                min_cost, ishealth, isalcohol, issmoking, name 
                from product where id_place = %s
                """)
                cursor.execute(query_product, (id,))
                rows_product = cursor.fetchall()
                for row_p in rows_product:
                    product = {
                        "id": row_p[0],
                        "type": row_p[1],
                        "min_cost": row_p[2],
                        "is_health": row_p[3],
                        "is_alcohol": row_p[4],
                        "is_smoking": row_p[5],
                        "name": row_p[6]
                    }
                    products.append(product)
            
            # Получаем рекламу только если нужно
            ads = []
            if need_ads is True:
                query_ads = sql.SQL("""
                            SELECT id, (SELECT reklama_type.type from reklama_type where reklama_type.id = reklama.type),
                            name, ishelth 
                            from reklama where id_place = %s
                            """)
                cursor.execute(query_ads, (id,))
                rows_ads = cursor.fetchall()
                for row_a in rows_ads:
                    ad = {
                        "id": row_a[0],
                        "type": row_a[1],
                        "name": row_a[2],
                        "is_health": row_a[3],
                    }
                    ads.append(ad)

            # Получаем отзывы (всегда загружаем)
            query_review = sql.SQL(
                """SELECT id, iduser, (SELECT users.name from users where users.id = reviews.iduser), idplace, text 
                from reviews where idplace=%s"""
            )
            cursor.execute(query_review, (id,))
            rows_review = cursor.fetchall()
            reviews = []
            for row_r in rows_review:
                review_id = row_r[0]
                # Получаем фото для этого отзыва
                query_photos = sql.SQL("""
                    SELECT url FROM reviews_photo WHERE review_id = %s
                """)
                cursor.execute(query_photos, (review_id,))
                rows_photos = cursor.fetchall()
                review_photos = [row_photo[0] for row_photo in rows_photos]
                
                # Получаем количество лайков и дизлайков
                query_ranks = sql.SQL("""
                    SELECT 
                        COUNT(*) FILTER (WHERE "like" = true) as like_count,
                        COUNT(*) FILTER (WHERE dislike = true) as dislike_count
                    FROM reviews_ranks 
                    WHERE review_id = %s
                """)
                cursor.execute(query_ranks, (review_id,))
                ranks_row = cursor.fetchone()
                like_count = ranks_row[0] if ranks_row else 0
                dislike_count = ranks_row[1] if ranks_row else 0
                
                review = {
                    "id": review_id,
                    "id_user": row_r[1],
                    "user_name": row_r[2],
                    "id_place": row_r[3],
                    "text": row_r[4],
                    "review_photos": review_photos,
                    "like": like_count,
                    "dislike": dislike_count,
                }
                reviews.append(review)

            # Получаем оборудование только если нужно
            sports = []
            if need_equipment is True:
                query_sport = sql.SQL(
                    """SELECT (SELECT type from sport_interfaces as si where si.id = sip.id_interface), count 
                    from sport_interfaces_place as sip where id_place = %s"""
                )
                cursor.execute(query_sport, (id,))
                rows_sport = cursor.fetchall()
                for row_s in rows_sport:
                    sport = {
                        "name": row_s[0],
                        "count": row_s[1],
                    }
                    sports.append(sport)

            # Получаем средний рейтинг отзывов для этого места
            query_review_rank = sql.SQL("""
                SELECT COALESCE(AVG(rating)::numeric(10,2), 0)
                FROM reviews 
                WHERE idPlace = %s AND rating IS NOT NULL
            """)
            cursor.execute(query_review_rank, (id,))
            review_rank_row = cursor.fetchone()
            review_rank = float(review_rank_row[0]) if review_rank_row[0] is not None else 0.0

            # Получаем фотографии для этого места
            query_photos = sql.SQL("""
                SELECT url FROM places_photos WHERE place_id = %s
            """)
            cursor.execute(query_photos, (id,))
            rows_photos = cursor.fetchall()
            photos = [row_photo[0] for row_photo in rows_photos]

            place = {"id": row[0], "name": row[1], "coord1": row[2], "coord2": row[3],
                     "type": row[4], "food_type": row[5], "is_alcohol": row[6],
                     "is_health": row[7], "is_insurance": row[8], "is_nosmoking": row[9],
                     "is_smoke": row[10], "rating": row[11], "sport_type": row[12], "info": row[13],
                     "distance_to_center": row[14], "is_moderated": row[15],
                     "reviews": reviews, "review_rank": review_rank, "photos": photos}
            
            # Добавляем поля только если они загружены
            if need_products is True:
                place["products"] = products
            if need_ads is True:
                place["ads"] = ads
            if need_equipment is True:
                place["equipment"] = sports
            
            places.append(place)
        return places

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
        return []
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')