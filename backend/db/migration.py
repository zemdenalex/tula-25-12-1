"""
Миграции
"""
import psycopg2
from psycopg2 import sql

import config as config

db_config = {
    'dbname': config.DB_NAME,
    'user': config.DB_USER,
    'password': config.DB_PASSWORD,
    'host': config.DB_HOST,
    'port': config.DB_PORT,
}


def db_connection():
    return psycopg2.connect(**db_config)


def migration_up():
    conn = db_connection()
    cur = conn.cursor()
    try:
        create = sql.SQL("""
CREATE TABLE IF NOT EXISTS places (
    id serial PRIMARY KEY,
    name varchar,
    coord1 float,
    coord2 float,
    type int,
    foodtype int,
    sporttype int,
    isSmoke bool default false,
    isAlcohol bool default false,
    isHealth bool default false,
    info varchar,
    isNoSmoking bool default false,
    isInsurence bool default false, --страхование какое то не помню
    rating int,
    creatAt timestamp,
    creatorId int,
    changeAt timestamp,
    changeId int
);
    
CREATE TABLE IF NOT EXISTS places_type (
    id serial PRIMARY KEY,
    type varchar
);

CREATE TABLE IF NOT EXISTS food_type (
    id serial PRIMARY KEY,
    type varchar
);
        
CREATE TABLE IF NOT EXISTS reklama (
id serial PRIMARY KEY,
id_place int,
type int,
name varchar,
isHelth bool default false
);

CREATE TABLE IF NOT EXISTS reklama_type (
id serial PRIMARY KEY,
type varchar
);

CREATE TABLE IF NOT EXISTS product (
id serial PRIMARY KEY,
id_place int,
type int,
min_cost float,
isHealth bool default false,
isAlcohol bool default false,
isSmoking bool default false,
name varchar
);

CREATE TABLE IF NOT EXISTS product_type (
id serial PRIMARY KEY,
type varchar
);

CREATE TABLE IF NOT EXISTS sport_type (
    id serial PRIMARY KEY,
    type varchar
);

CREATE TABLE IF NOT EXISTS sport_interfaces (
id serial PRIMARY KEY,
type varchar
);

CREATE TABLE IF NOT EXISTS sport_interfaces_place (
id_place int,
id_interface int,
count int
);

CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    name varchar,
    email varchar,
    password varchar,
    rating int default 100,
    isBanned bool default false,
    bannedTo int,
    bannedAt timestamp,
    phone varchar,
    photo varchar
);

CREATE TABLE IF NOT EXISTS reviews (
    id serial PRIMARY KEY,
    idUser int,
    idPlace int,
    text varchar,
    rating int
);

CREATE TABLE IF NOT EXISTS reviews_photo (
    id serial PRIMARY KEY,
    review_id int,
    url varchar
);

CREATE TABLE IF NOT EXISTS reviews_ranks (
    id serial PRIMARY KEY,
    review_id int,
    user_id int,
    "like" bool default false,
    dislike bool default false
);

CREATE TABLE IF NOT EXISTS admins (
    id serial PRIMARY KEY,
    idAssigned int,
    email varchar,
    password varchar,
    name varchar
);

""")

        cur.execute(create)
        
        # Добавляем поля phone и photo к существующей таблице users, если их нет
        try:
            cur.execute("""
                DO $$ 
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name='users' AND column_name='phone') THEN
                        ALTER TABLE users ADD COLUMN phone varchar;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name='users' AND column_name='photo') THEN
                        ALTER TABLE users ADD COLUMN photo varchar;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name='reviews' AND column_name='rating') THEN
                        ALTER TABLE reviews ADD COLUMN rating int;
                    END IF;
                END $$;
            """)
        except Exception as e:
            # Игнорируем ошибки, если поля уже существуют
            pass
        
        conn.commit()
    except (Exception, psycopg2.DatabaseError) as error:
        return error
    finally:
        if conn:
            cur.close()
            conn.close()


def migration_down():
    conn = db_connection()
    cur = conn.cursor()
    try:
        drop = sql.SQL("""DROP TABLE IF EXISTS admins, places, places_type, product,
                            product_type, reklama, reklama_type, reviews, reviews_photo, reviews_ranks, sport_type, sport_interfaces,
                            sport_interfaces_place, food_type, users;""")

        cur.execute(drop)
        conn.commit()
    except (Exception, psycopg2.DatabaseError) as error:
        return error
    finally:
        if conn:
            cur.close()
            conn.close()





if __name__ == "__main__":
    migration_down()
    migration_up()
