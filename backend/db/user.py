import hashlib
import psycopg2
from psycopg2 import sql
import logging

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


async def add_review(message: str, user_id: int, place_id: int) -> bool:
    """Добавляет отзыв. Возвращает True при успехе, False при ошибке"""
    connection = db_connection()
    cursor = connection.cursor()

    try:
        # Проверяем, существует ли пользователь
        check_user = sql.SQL("SELECT id FROM users WHERE id = %s")
        cursor.execute(check_user, (user_id,))
        if not cursor.fetchone():
            return False

        # Проверяем, существует ли место
        check_place = sql.SQL("SELECT id FROM places WHERE id = %s")
        cursor.execute(check_place, (place_id,))
        if not cursor.fetchone():
            return False

        # Проверяем, что сообщение не пустое и не содержит только пробелы
        if not message or not message.strip():
            return False

        # Добавляем отзыв
        query = sql.SQL("""
            INSERT INTO reviews (idUser, idPlace, text)
            VALUES (%s, %s, %s)
        """)
        cursor.execute(query, (user_id, place_id, message.strip()))
        
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
            SELECT id, name, email, phone, photo, rating
            FROM users
            ORDER BY id
        """)
        cursor.execute(query)

        rows = cursor.fetchall()
        users = []
        for row in rows:
            user = {
                "user_id": row[0],
                "name": row[1],
                "email": row[2],
                "phone": row[3],
                "photo": row[4],
                "rating": row[5]
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
            SELECT id, name, email, phone, photo, rating
            FROM users
            WHERE id = %s
        """)
        cursor.execute(query, (user_id,))

        row = cursor.fetchone()
        if row:
            user = {
                "user_id": row[0],
                "name": row[1],
                "email": row[2],
                "phone": row[3],
                "photo": row[4],
                "rating": row[5]
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

