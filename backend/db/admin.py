import hashlib
import logging
from datetime import datetime
from typing import Optional

import psycopg2
from psycopg2 import sql

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
    return hashlib.sha256(password.encode()).hexdigest()


async def create_admin(id_invite: int, name: str, email: str, password: str) -> int:
    connection = db_connection()
    cursor = connection.cursor()

    try:
        check_invite_query = sql.SQL("SELECT id FROM admins WHERE id = %s")
        cursor.execute(check_invite_query, (id_invite,))
        if not cursor.fetchone():
            return None

        check_email_query = sql.SQL("SELECT id FROM admins WHERE email = %s")
        cursor.execute(check_email_query, (email,))
        if cursor.fetchone():
            return None

        hashed_password = hash_password(password)

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
    connection = db_connection()
    cursor = connection.cursor()

    try:
        check_query = sql.SQL("SELECT id, rating FROM users WHERE id = %s")
        cursor.execute(check_query, (user_id,))
        row = cursor.fetchone()
        if not row:
            return False

        current_rating = row[1] + rating

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
    connection = db_connection()
    cursor = connection.cursor()

    try:
        check_query = sql.SQL("SELECT id FROM places WHERE id = %s")
        cursor.execute(check_query, (place_id,))
        if not cursor.fetchone():
            return False

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
    connection = db_connection()
    cursor = connection.cursor()

    try:
        check_query = sql.SQL("SELECT id FROM users WHERE id = %s")
        cursor.execute(check_query, (user_id,))
        if not cursor.fetchone():
            return False

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
    connection = db_connection()
    cursor = connection.cursor()

    try:
        check_query = sql.SQL("""
            SELECT idplace, iduser FROM reviews WHERE id = %s
        """)
        cursor.execute(check_query, (review_id,))
        
        row = cursor.fetchone()
        if not row:
            return False
        
        place_id = row[0]
        user_id = row[1]

        delete_query = sql.SQL("""
            DELETE FROM reviews WHERE id = %s
        """)
        cursor.execute(delete_query, (review_id,))

        if rating is not None:
            get_rating_query = sql.SQL("""
                SELECT rating FROM users WHERE id = %s
            """)
            cursor.execute(get_rating_query, (user_id,))
            rating_row = cursor.fetchone()
            if not rating_row:
                return False
            
            old_rating = rating_row[0]
            new_rating = old_rating + rating

            update_user_rating_query = sql.SQL("""
                UPDATE users SET rating = %s WHERE id = %s
            """)
            cursor.execute(update_user_rating_query, (new_rating, user_id))
        else:
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

