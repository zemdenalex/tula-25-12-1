"""
Модуль для работы с администраторами
Использует структуру БД из migration.py
"""
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


async def create_admin(id_invite: int, name: str, email: str, password: str) -> int:
    """Создает нового админа. Возвращает id нового админа или None при ошибке"""
    connection = db_connection()
    cursor = connection.cursor()

    try:
        # Проверяем, что приглашающий админ существует
        check_invite_query = sql.SQL("SELECT id FROM admins WHERE id = %s")
        cursor.execute(check_invite_query, (id_invite,))
        if not cursor.fetchone():
            return None  # Приглашающий админ не найден

        # Проверяем, существует ли админ с таким email
        check_email_query = sql.SQL("SELECT id FROM admins WHERE email = %s")
        cursor.execute(check_email_query, (email,))
        if cursor.fetchone():
            return None  # Админ с таким email уже существует

        # Хешируем пароль
        hashed_password = hash_password(password)

        # Создаем админа
        # Используем имена полей из migration.py: idAssigned -> idassigned (PostgreSQL приводит к нижнему регистру)
        query = sql.SQL("""
            INSERT INTO admins (idassigned, name, email, password)
            VALUES (%s, %s, %s, %s)
            RETURNING id;
        """)
        cursor.execute(query, (id_invite, name, email, hashed_password))
        
        row = cursor.fetchone()
        admin_id = row[0]
        connection.commit()
        return admin_id

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
        connection.rollback()
        return None
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info('Database connection closed.')


async def login_admin(email: str, password: str) -> int:
    """Проверяет email и password админа, возвращает admin_id при успехе"""
    connection = db_connection()
    cursor = connection.cursor()

    try:
        hashed_password = hash_password(password)
        
        query = sql.SQL("""
            SELECT id FROM admins 
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


async def update_user_rating(user_id: int, rating: int) -> bool:
    """Обновляет рейтинг пользователя. Возвращает True при успехе"""
    connection = db_connection()
    cursor = connection.cursor()

    try:
        # Проверяем, существует ли пользователь
        check_query = sql.SQL("SELECT id, rating FROM users WHERE id = %s")
        cursor.execute(check_query, (user_id,))
        if not cursor.fetchone():
            return False

        current_rating = cursor.fetchone()[1] + rating

        # Обновляем рейтинг
        query = sql.SQL("""
            UPDATE users SET rating = %s WHERE id = %s
        """)
        cursor.execute(query, (current_rating, user_id))
        
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


async def verify_place(place_id: int, verify: bool) -> bool:
    """Устанавливает флаг верификации места. Возвращает True при успехе"""
    connection = db_connection()
    cursor = connection.cursor()

    try:
        # Проверяем, существует ли место
        check_query = sql.SQL("SELECT id FROM places WHERE id = %s")
        cursor.execute(check_query, (place_id,))
        if not cursor.fetchone():
            return False

        # Обновляем флаг верификации
        query = sql.SQL("""
            UPDATE places SET is_moderated = %s WHERE id = %s
        """)
        cursor.execute(query, (verify, place_id))
        
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


async def ban_user(user_id: int) -> bool:
    """Банит пользователя, устанавливает isBanned=true, bannedAt=текущее время. Возвращает True при успехе"""
    connection = db_connection()
    cursor = connection.cursor()

    try:
        # Проверяем, существует ли пользователь
        check_query = sql.SQL("SELECT id FROM users WHERE id = %s")
        cursor.execute(check_query, (user_id,))
        if not cursor.fetchone():
            return False

        # Баним пользователя
        # Используем имена полей из migration.py: isBanned -> isbanned, bannedAt -> bannedat
        current_time = datetime.now()
        query = sql.SQL("""
            UPDATE users 
            SET isbanned = true, bannedat = %s 
            WHERE id = %s
        """)
        cursor.execute(query, (current_time, user_id))
        
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


async def delete_review_admin(review_id: int, rating: Optional[int] = None) -> bool:
    """
    Удаляет отзыв админом. 
    Если указан rating, обновляет рейтинг автора отзыва (пользователя) на это значение.
    Иначе пересчитывает рейтинг места автоматически.
    Возвращает True при успехе
    """
    connection = db_connection()
    cursor = connection.cursor()

    try:
        # Проверяем, существует ли отзыв и получаем idPlace и idUser
        # Используем имена полей из migration.py: idPlace -> idplace, idUser -> iduser
        check_query = sql.SQL("""
            SELECT idplace, iduser FROM reviews WHERE id = %s
        """)
        cursor.execute(check_query, (review_id,))
        
        row = cursor.fetchone()
        if not row:
            return False  # Отзыв не найден
        
        place_id = row[0]
        user_id = row[1]

        # Удаляем отзыв
        delete_query = sql.SQL("""
            DELETE FROM reviews WHERE id = %s
        """)
        cursor.execute(delete_query, (review_id,))
        
        # Обновляем рейтинг
        if rating is not None:
            # Получаем старый рейтинг пользователя
            get_rating_query = sql.SQL("""
                SELECT rating FROM users WHERE id = %s
            """)
            cursor.execute(get_rating_query, (user_id,))
            rating_row = cursor.fetchone()
            if not rating_row:
                return False  # Пользователь не найден
            
            old_rating = rating_row[0]
            # Вычитаем новый рейтинг из старого
            new_rating = old_rating + rating
            
            # Обновляем рейтинг автора отзыва (пользователя)
            update_user_rating_query = sql.SQL("""
                UPDATE users SET rating = %s WHERE id = %s
            """)
            cursor.execute(update_user_rating_query, (new_rating, user_id))
        else:
            # Пересчитываем рейтинг места автоматически
            # Используем функцию из map.py через SQL
            update_place_rating_query = sql.SQL("""
                UPDATE places 
                SET rating = calculate_health_rating(%s) 
                WHERE id = %s
            """)
            cursor.execute(update_place_rating_query, (place_id, place_id))
        
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

