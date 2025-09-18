'''
API для регистрации и авторизации пользователей социальной сети
Обрабатывает регистрацию, вход, выход и получение данных пользователя
'''

import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Получение подключения к базе данных"""
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if not DATABASE_URL:
        raise Exception('DATABASE_URL environment variable not set')
    
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def hash_password(password: str) -> str:
    """Хеширование пароля"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_session_token() -> str:
    """Генерация токена сессии"""
    return secrets.token_urlsafe(32)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Обработка запросов аутентификации
    POST /register - регистрация пользователя
    POST /login - вход пользователя
    POST /logout - выход пользователя
    GET /me - получение данных текущего пользователя
    '''
    
    method: str = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action', '')
    
    # Обработка CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if method == 'POST' and action == 'register':
            # Регистрация нового пользователя
            body_data = json.loads(event.get('body', '{}'))
            
            username = body_data.get('username', '').strip()
            email = body_data.get('email', '').strip().lower()
            password = body_data.get('password', '')
            full_name = body_data.get('fullName', '').strip()
            
            if not all([username, email, password, full_name]):
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Заполните все обязательные поля'})
                }
            
            if len(password) < 6:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Пароль должен содержать минимум 6 символов'})
                }
            
            # Проверка уникальности email и username
            cursor.execute(
                "SELECT id FROM users WHERE email = %s OR username = %s",
                (email, username)
            )
            if cursor.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Пользователь с таким email или username уже существует'})
                }
            
            # Создание пользователя
            password_hash = hash_password(password)
            cursor.execute("""
                INSERT INTO users (username, email, password_hash, full_name)
                VALUES (%s, %s, %s, %s)
                RETURNING id, username, email, full_name, avatar_url, followers_count, following_count, posts_count, created_at
            """, (username, email, password_hash, full_name))
            
            user = cursor.fetchone()
            
            # Создание сессии
            session_token = generate_session_token()
            expires_at = datetime.now() + timedelta(days=30)
            
            cursor.execute("""
                INSERT INTO user_sessions (user_id, session_token, expires_at)
                VALUES (%s, %s, %s)
            """, (user['id'], session_token, expires_at))
            
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'user': dict(user),
                    'session_token': session_token,
                    'message': 'Регистрация успешна'
                })
            }
        
        elif method == 'POST' and action == 'login':
            # Вход пользователя
            body_data = json.loads(event.get('body', '{}'))
            
            email = body_data.get('email', '').strip().lower()
            password = body_data.get('password', '')
            
            if not email or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Введите email и пароль'})
                }
            
            # Поиск пользователя
            password_hash = hash_password(password)
            cursor.execute("""
                SELECT id, username, email, full_name, avatar_url, followers_count, following_count, posts_count
                FROM users 
                WHERE email = %s AND password_hash = %s
            """, (email, password_hash))
            
            user = cursor.fetchone()
            if not user:
                return {
                    'statusCode': 401,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Неверный email или пароль'})
                }
            
            # Создание новой сессии
            session_token = generate_session_token()
            expires_at = datetime.now() + timedelta(days=30)
            
            cursor.execute("""
                INSERT INTO user_sessions (user_id, session_token, expires_at)
                VALUES (%s, %s, %s)
            """, (user['id'], session_token, expires_at))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'user': dict(user),
                    'session_token': session_token,
                    'message': 'Вход выполнен успешно'
                })
            }
        
        elif method == 'POST' and action == 'logout':
            # Выход пользователя
            headers = event.get('headers', {})
            session_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
            
            if session_token:
                cursor.execute(
                    "UPDATE user_sessions SET expires_at = NOW() WHERE session_token = %s",
                    (session_token,)
                )
                conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'message': 'Выход выполнен успешно'})
            }
        
        elif method == 'GET' and action == 'me':
            # Получение данных текущего пользователя
            headers = event.get('headers', {})
            session_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
            
            if not session_token:
                return {
                    'statusCode': 401,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Токен аутентификации не предоставлен'})
                }
            
            # Проверка сессии
            cursor.execute("""
                SELECT u.id, u.username, u.email, u.full_name, u.avatar_url, u.bio,
                       u.followers_count, u.following_count, u.posts_count, u.is_verified
                FROM users u
                JOIN user_sessions s ON u.id = s.user_id
                WHERE s.session_token = %s AND s.expires_at > NOW()
            """, (session_token,))
            
            user = cursor.fetchone()
            if not user:
                return {
                    'statusCode': 401,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Недействительный или истекший токен'})
                }
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'user': dict(user)})
            }
        
        else:
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Endpoint не найден'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': f'Внутренняя ошибка сервера: {str(e)}'})
        }
    
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()