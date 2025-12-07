import hashlib
import psycopg2
from psycopg2 import sql
import logging
from datetime import datetime
from typing import Optional

from db.migration import db_connection

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)


def hash_password(password: str) -> str:
    """Хеширует пароль"""
    return hashlib.sha256(password.encode()).hexdigest()


async def create_user(name: str, email: str, password: str) -> int:
    """Создает нового пользователя и возвращает user_id"""
    connection = db_connection()
    cursor = connection.cursor()

    try:
        # Проверяем, существует ли пользователь с таким email
        check_query = sql.SQL("SELECT id FROM users WHERE email = %s")
        cursor.execute(check_query, (email,))
        if cursor.fetchone():
            return None  # Пользователь уже существует

        # Хешируем пароль
        hashed_password = hash_password(password)

        # Создаем пользователя
        query = sql.SQL("""
            INSERT INTO users (name, email, password)
            VALUES (%s, %s, %s)
            RETURNING id;
        """)
        cursor.execute(query, (name, email, hashed_password))

        row = cursor.fetchone()
        user_id = row[0]
        connection.commit()
        return user_id

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
        connection.rollback()
        return None
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')


async def login_user(email: str, password: str) -> int:
    """Проверяет email и password, возвращает user_id при успехе"""
    connection = db_connection()
    cursor = connection.cursor()

    try:
        hashed_password = hash_password(password)

        query = sql.SQL("""
            SELECT id FROM users 
            WHERE email = %s AND password = %s
        """)
        cursor.execute(query, (email, hashed_password))

        row = cursor.fetchone()
        if row:
            return row[0]
        return None

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
        return None
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')


async def add_review(message: str, user_id: int, place_id: int, rating: int, photo_urls: list = None) -> bool:
    """Добавляет отзыв с рейтингом и фото. Возвращает True при успехе, False при ошибке"""
    connection = db_connection()
    cursor = connection.cursor()

    try:
        # Проверяем, существует ли пользователь
        check_user = sql.SQL("SELECT id, rating FROM users WHERE id = %s")
        cursor.execute(check_user, (user_id,))
        row = cursor.fetchone()
        if not row:
            return False
        else:
            add_rating_cnt = 5
            if photo_urls and len(photo_urls) > 0:
                add_rating_cnt += 10
            add_rating = """UPDATE users 
                                SET rating = %s
                                WHERE id = %s"""
            cursor.execute(add_rating, (row[1] + add_rating_cnt, user_id))

        # Проверяем, существует ли место
        check_place = sql.SQL("SELECT id FROM places WHERE id = %s")
        cursor.execute(check_place, (place_id,))
        if not cursor.fetchone():
            return False

        # Проверяем, что сообщение не пустое и не содержит только пробелы
        if not message or not message.strip():
            return False

        # Проверяем рейтинг (должен быть от 1 до 5)
        if rating < 1 or rating > 5:
            return False

        # Добавляем отзыв
        query = sql.SQL("""
            INSERT INTO reviews (idUser, idPlace, text, rating)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """)
        cursor.execute(query, (user_id, place_id, message.strip(), rating))

        review_id = cursor.fetchone()[0]

        # Добавляем фото, если они есть
        if photo_urls:
            photo_query = sql.SQL("""
                INSERT INTO reviews_photo (review_id, url)
                VALUES (%s, %s)
            """)
            for photo_url in photo_urls:
                cursor.execute(photo_query, (review_id, photo_url))

        connection.commit()
        return True

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
        connection.rollback()
        return False
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')


async def get_all_users() -> list:
    """Возвращает список всех пользователей"""
    connection = db_connection()
    cursor = connection.cursor()

    try:
        query = sql.SQL("""
            SELECT id, name, email, phone, rating
            FROM users
            ORDER BY id
        """)
        cursor.execute(query)

        rows = cursor.fetchall()
        users = []
        for row in rows:
            user_id = row[0]
            # Получаем фото из таблицы users_photos для каждого пользователя
            query_photo = sql.SQL("""
                SELECT url FROM users_photos WHERE user_id = %s LIMIT 1
            """)
            cursor.execute(query_photo, (user_id,))
            photo_row = cursor.fetchone()
            photo = photo_row[0] if photo_row else None

            user = {
                "user_id": user_id,
                "name": row[1],
                "email": row[2],
                "phone": row[3],
                "rating": row[4],
                "photo": photo
            }
            users.append(user)
        return users

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
        return []
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')


async def get_user_by_id(user_id: int) -> dict:
    """Возвращает информацию о пользователе по ID"""
    connection = db_connection()
    cursor = connection.cursor()

    try:
        query = sql.SQL("""
            SELECT id, name, email, phone, rating
            FROM users
            WHERE id = %s
        """)
        cursor.execute(query, (user_id,))

        row = cursor.fetchone()
        if row:
            # Получаем фото из таблицы users_photos
            query_photo = sql.SQL("""
                SELECT url FROM users_photos WHERE user_id = %s LIMIT 1
            """)
            cursor.execute(query_photo, (user_id,))
            photo_row = cursor.fetchone()
            photo = photo_row[0] if photo_row else None

            user = {
                "user_id": row[0],
                "name": row[1],
                "email": row[2],
                "phone": row[3],
                "rating": row[4],
                "photo": photo
            }
            return user
        return None

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
        return None
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')


async def delete_review(user_id: int, review_id: int) -> str:
    """Удаляет отзыв. Возвращает 'ok', 'not_author' или 'error'"""
    connection = db_connection()
    cursor = connection.cursor()

    try:
        # Проверяем, существует ли отзыв и принадлежит ли он пользователю
        check_query = sql.SQL("""
            SELECT idUser FROM reviews WHERE id = %s
        """)
        cursor.execute(check_query, (review_id,))

        row = cursor.fetchone()
        if not row:
            return 'error'  # Отзыв не найден

        if row[0] != user_id:
            return 'not_author'  # Пользователь не является автором

        # Удаляем отзыв
        delete_query = sql.SQL("""
            DELETE FROM reviews WHERE id = %s
        """)
        cursor.execute(delete_query, (review_id,))

        connection.commit()
        return 'ok'

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
        connection.rollback()
        return 'error'
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')


async def update_user(user_id: int, user_data: dict) -> bool:
    """
    Обновляет информацию о пользователе. 
    Принимает словарь с полями для обновления (все опциональные, кроме user_id).
    Возвращает True при успехе, False при ошибке.
    """
    connection = db_connection()
    cursor = connection.cursor()

    try:
        # Проверяем, существует ли пользователь
        check_query = sql.SQL("SELECT id FROM users WHERE id = %s")
        cursor.execute(check_query, (user_id,))
        if not cursor.fetchone():
            return False

        check = ("""SELECT u.name, u.email, u.password, up.url, u.phone from users as u 
                         left join users_photos as up on up.user_id = u.id
                         WHERE u.id = %s""")
        cursor.execute(check, (user_id,))
        row = cursor.fetchone()
        cnt = [elem for elem in row].count(None)

        # Строим UPDATE запрос динамически
        update_fields = []
        update_values = []

        if 'name' in user_data and user_data['name'] is not None:
            update_fields.append("name = %s")
            update_values.append(user_data['name'])

        if 'email' in user_data and user_data['email'] is not None:
            update_fields.append("email = %s")
            update_values.append(user_data['email'])

        if 'password' in user_data and user_data['password'] is not None:
            # Хешируем пароль перед сохранением
            hashed_password = hash_password(user_data['password'])
            update_fields.append("password = %s")
            update_values.append(hashed_password)

        if 'rating' in user_data and user_data['rating'] is not None:
            update_fields.append("rating = %s")
            update_values.append(user_data['rating'])

        if 'phone' in user_data and user_data['phone'] is not None:
            update_fields.append("phone = %s")
            update_values.append(user_data['phone'])

        # Обновляем основные поля пользователя
        if update_fields:
            update_query = "UPDATE users SET " + ", ".join(update_fields) + " WHERE id = %s"
            update_values.append(user_id)
            cursor.execute(update_query, tuple(update_values))

        # Обрабатываем фото отдельно через таблицу users_photos
        if 'photo' in user_data and user_data['photo'] is not None:
            # Удаляем все существующие фотографии для этого пользователя
            query_delete_photos = sql.SQL("DELETE FROM users_photos WHERE user_id = %s")
            cursor.execute(query_delete_photos, (user_id,))

            # Добавляем новую фотографию
            query_photo = sql.SQL("""
                INSERT INTO users_photos (user_id, url) VALUES (%s, %s)
            """)
            cursor.execute(query_photo, (user_id, user_data['photo']))

        check = ("""SELECT u.rating, u.name, u.email, u.password, up.url, u.phone from users as u 
                 left join users_photos as up on up.user_id = u.id
                 WHERE u.id = %s""")
        cursor.execute(check, (user_id, ))
        row = cursor.fetchone()
        cnt_2 = [elem for elem in row].count(None)
        if cnt_2 == 0 and cnt != 0:
            add_rating = """UPDATE users 
                                    SET rating = %s
                                    WHERE id = %s"""
            cursor.execute(add_rating, (row[0] + 15, user_id))



        connection.commit()
        return True

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(f"Ошибка при обновлении пользователя: {error}")
        connection.rollback()
        return False
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')


async def set_review_rank(user_id: int, review_id: int, like: bool = None, dislike: bool = None) -> bool:
    """Устанавливает лайк или дизлайк на отзыв. Возвращает True при успехе, False при ошибке"""
    connection = db_connection()
    cursor = connection.cursor()

    try:
        # Проверяем, что передан хотя бы один параметр
        if like is None and dislike is None:
            return False

        # Проверяем, что не переданы оба параметра одновременно как True
        if like is True and dislike is True:
            return False

        # Проверяем, существует ли отзыв
        check_review = sql.SQL("SELECT id FROM reviews WHERE id = %s")
        cursor.execute(check_review, (review_id,))
        if not cursor.fetchone():
            return False

        # Проверяем, существует ли пользователь
        check_user = sql.SQL("SELECT id, rating FROM users WHERE id = %s")
        cursor.execute(check_user, (user_id,))
        row = cursor.fetchone()
        if not row:
            return False

        # Проверяем, существует ли уже запись для этого пользователя и отзыва
        check_existing = sql.SQL("""
            SELECT id, "like", dislike FROM reviews_ranks 
            WHERE review_id = %s AND user_id = %s
        """)
        cursor.execute(check_existing, (review_id, user_id))
        existing = cursor.fetchone()

        if like is True:
            if existing:
                existing_id, existing_like, existing_dislike = existing
                if existing_like:
                    # Если уже стоит like, удаляем запись
                    delete_query = sql.SQL("DELETE FROM reviews_ranks WHERE id = %s")
                    cursor.execute(delete_query, (existing_id,))
                elif existing_dislike:
                    # Если стоит dislike, меняем на like
                    update_query = sql.SQL("""
                        UPDATE reviews_ranks 
                        SET "like" = true, dislike = false 
                        WHERE id = %s
                    """)
                    cursor.execute(update_query, (existing_id,))
                    add_rating = """UPDATE users 
                                        SET rating = %s
                                        WHERE id = %s"""
                    cursor.execute(add_rating, (row[1] + 1, user_id))
                else:
                    add_rating = """UPDATE users 
                                        SET rating = %s
                                        WHERE id = %s"""
                    cursor.execute(add_rating, (row[1] + 1, user_id))
            else:
                # Создаем новую запись с like
                insert_query = sql.SQL("""
                    INSERT INTO reviews_ranks (review_id, user_id, "like", dislike)
                    VALUES (%s, %s, true, false)
                """)
                cursor.execute(insert_query, (review_id, user_id))

        elif dislike is True:
            if existing:
                existing_id, existing_like, existing_dislike = existing
                if existing_dislike:
                    # Если уже стоит dislike, удаляем запись
                    delete_query = sql.SQL("DELETE FROM reviews_ranks WHERE id = %s")
                    cursor.execute(delete_query, (existing_id,))
                elif existing_like:
                    # Если стоит like, меняем на dislike
                    update_query = sql.SQL("""
                        UPDATE reviews_ranks 
                        SET "like" = false, dislike = true 
                        WHERE id = %s
                    """)
                    cursor.execute(update_query, (existing_id,))
            else:
                # Создаем новую запись с dislike
                insert_query = sql.SQL("""
                    INSERT INTO reviews_ranks (review_id, user_id, "like", dislike)
                    VALUES (%s, %s, false, true)
                """)
                cursor.execute(insert_query, (review_id, user_id))

        connection.commit()
        return True

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
        connection.rollback()
        return False
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')


async def add_follow(user_id: int, follow_id: int) -> bool:
    """Добавляет подписку пользователя user_id на пользователя follow_id. Возвращает True при успехе, False при ошибке"""
    connection = db_connection()
    cursor = connection.cursor()

    try:
        # Проверяем, что оба пользователя существуют
        check_user = sql.SQL("SELECT id, rating FROM users WHERE id = %s")
        cursor.execute(check_user, (user_id,))
        row = cursor.fetchone()
        if not row:
            return False
        else:
            add_rating = """UPDATE users 
                        SET rating = %s
                        WHERE id = %s"""
            cursor.execute(add_rating, (row[1] + 1, user_id))
        cursor.execute(check_user, (follow_id,))
        if not cursor.fetchone():
            return False

        # Проверяем, что пользователь не пытается подписаться на самого себя
        if user_id == follow_id:
            return False

        # Проверяем, не подписан ли уже
        check_follow = sql.SQL("""
            SELECT user_id FROM follow WHERE user_id = %s AND follow_id = %s
        """)
        cursor.execute(check_follow, (user_id, follow_id,))
        if cursor.fetchone():
            return True  # Уже подписан

        # Добавляем подписку
        query = sql.SQL("""
            INSERT INTO follow (user_id, follow_id)
            VALUES (%s, %s)
        """)
        cursor.execute(query, (user_id, follow_id,))

        connection.commit()
        return True

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
        connection.rollback()
        return False
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')


async def get_followed_reviews(user_id: int) -> list:
    """Возвращает список отзывов от пользователей, на которых подписан user_id, отсортированные по id отзыва"""
    connection = db_connection()
    cursor = connection.cursor()

    try:
        # Получаем все отзывы от пользователей, на которых подписан user_id
        query = sql.SQL("""
            SELECT 
                r.id,
                r.idUser,
                u.name,
                r.idPlace,
                r.text,
                r.rating
            FROM reviews r
            INNER JOIN follow f ON r.idUser = f.follow_id
            INNER JOIN users u ON r.idUser = u.id
            WHERE f.user_id = %s
            ORDER BY r.id
        """)
        cursor.execute(query, (user_id,))

        rows = cursor.fetchall()
        reviews = []

        for row in rows:
            review_id = row[0]

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
                "id_user": row[1],
                "user_name": row[2],
                "id_place": row[3],
                "text": row[4],
                "rating": row[5],
                "review_photos": review_photos,
                "like": like_count,
                "dislike": dislike_count,
            }
            reviews.append(review)

        return reviews

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
        return []
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')


async def get_leaderboard() -> list:
    connection = db_connection()
    cursor = connection.cursor()

    try:
        query = sql.SQL("""
                SELECT 
                    id, name, rating
                    FROM users WHERE isbanned = false
                    order by rating;
            """)
        cursor.execute(query,)

        rows = cursor.fetchall()
        users = []

        for row in rows:
            user_id = row[0]

            # Получаем фото для этого отзыва
            query_photos = sql.SQL("""
                    SELECT url FROM users_photos WHERE user_id = %s ORDER BY id DESC LIMIT 1
                """)
            cursor.execute(query_photos, (user_id,))
            row_photo = cursor.fetchone()
            user_photos = row_photo[0] if row_photo else None


            user = {
                "id": user_id,
                "user_name": row[1],
                "rating": row[2],
                "user_photos": user_photos,
            }
            users.append(user)

        return users

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
        return []
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')
