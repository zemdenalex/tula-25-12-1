import hashlib
import time
from datetime import datetime, timedelta

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


async def get_all_places() -> list:
    connection = db_connection()
    cursor = connection.cursor()

    try:
        query = sql.SQL("""
SELECT p.id, p.name, p.coord1, p.coord2, pt.type, ft.type,
    p.isalcohol, p.ishealth, p.isinsurence, p.isnosmoking, p.issmoke, p.rating, st.type, p.info
FROM places p
LEFT JOIN places_type pt ON p.type = pt.id
LEFT JOIN food_type ft ON p.foodtype = ft.id
LEFT JOIN sport_type st ON st.id = p.sporttype; 
        """)
        cursor.execute(query)

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

            place = {"id": row[0], "name": row[1], "coord1": row[2], "coord2": row[3],
                     "type": row[4], "food_type": row[5], "is_alcohol": row[6],
                     "is_health": row[7], "is_insurance": row[8], "is_nosmoking": row[9],
                     "is_smoke": row[10], "rating": row[11], "sport_type": row[12], "info": row[13], "products": products,
                     "ads": ads,
                     "reviews": reviews, "equipment": sports}
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

        place = {"id": row[0], "name": row[1], "coord1": row[2], "coord2": row[3],
                 "type": row[4], "food_type": row[5], "is_alcohol": row[6],
                 "is_health": row[7], "is_insurance": row[8], "is_nosmoking": row[9],
                 "is_smoke": row[10], "rating": row[11], "sport_type": row[12], "info": row[13], "products": products,
                 "ads": ads,
                 "reviews": reviews, "equipment": sports}

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
        cursor.execute(query, (place['name'], place['info'], place['coord1'], place['coord2'],
                               place['type'], place['food_type'],
                               place['is_alcohol'], place['is_health'], place['is_insurance'],
                               place["is_nosmoking"], place["is_smoke"], place["rating"], place["sport_type"]))

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
        cursor.connection.commit()
        return id

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')


async def update_place_info(place_id: int, place_data: dict) -> bool:
    connection = db_connection()
    cursor = connection.cursor()

    try:
        # Check if place exists
        check_query = sql.SQL("SELECT id FROM places WHERE id = %s")
        cursor.execute(check_query, (place_id,))
        if not cursor.fetchone():
            return False

        # Build UPDATE query dynamically based on provided fields
        # Note: name, type, coord1, coord2 are protected and cannot be changed
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
        if 'rating' in place_data and place_data['rating'] is not None:
            update_fields.append("rating = %s")
            update_values.append(place_data['rating'])
        if 'sport_type' in place_data and place_data['sport_type'] is not None:
            update_fields.append("sporttype = %s")
            update_values.append(place_data['sport_type'])

        # Update main place fields if any were provided
        if update_fields:
            update_query = "UPDATE places SET " + ", ".join(update_fields) + " WHERE id = %s"
            update_values.append(place_id)
            cursor.execute(update_query, tuple(update_values))

        # Add new products if provided
        if 'products' in place_data and place_data['products']:
            query_product = sql.SQL("""
                INSERT INTO product (type, min_cost, ishealth, isalcohol, issmoking, name, id_place) 
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """)
            for product in place_data['products']:
                cursor.execute(query_product,
                             (product.get('type'), product.get('min_cost'), product.get('is_health'),
                              product.get('is_alcohol'), product.get('is_smoking'), product.get('name'), place_id))

        # Add new ads if provided
        if 'ads' in place_data and place_data['ads']:
            query_ads = sql.SQL("""
                INSERT INTO reklama (id_place, type, name, ishelth) VALUES (%s, %s, %s, %s);
            """)
            for ad in place_data['ads']:
                cursor.execute(query_ads, (place_id, ad.get('type'), ad.get('name'), ad.get('is_health')))

        # Add new equipment if provided
        if 'equipment' in place_data and place_data['equipment']:
            query_sport = sql.SQL("""
                INSERT INTO sport_interfaces_place (id_place, id_interface, count) VALUES (%s, %s, %s)
            """)
            for sport in place_data['equipment']:
                cursor.execute(query_sport, (place_id, sport.get('type'), sport.get('count')))

        cursor.connection.commit()
        return True

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
        cursor.connection.rollback()
        return False
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')