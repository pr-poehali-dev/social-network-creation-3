'''
API для загрузки изображений
Обрабатывает загрузку изображений для постов и аватаров
'''

import json
import os
import base64
import uuid
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Получение подключения к базе данных"""
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if not DATABASE_URL:
        raise Exception('DATABASE_URL environment variable not set')
    
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def get_user_from_token(cursor, session_token: str) -> Optional[Dict]:
    """Получение пользователя по токену сессии"""
    cursor.execute("""
        SELECT u.id, u.username, u.full_name, u.avatar_url
        FROM users u
        JOIN user_sessions s ON u.id = s.user_id
        WHERE s.session_token = %s AND s.expires_at > NOW()
    """, (session_token,))
    return cursor.fetchone()

def save_image_to_storage(image_data: str, filename: str) -> str:
    """Сохранение изображения в хранилище (имитация)"""
    # В реальном проекте здесь была бы загрузка в S3, Cloudinary или другое хранилище
    # Для демонстрации возвращаем URL-заглушку
    image_id = str(uuid.uuid4())
    return f"https://via.placeholder.com/600x400/4F46E5/FFFFFF?text=Image+{image_id[:8]}"

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Обработка загрузки изображений
    POST / - загрузка изображения
    '''
    
    method: str = event.get('httpMethod', 'POST')
    
    # Обработка CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Получение токена авторизации
        headers = event.get('headers', {})
        session_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
        
        if not session_token:
            return {
                'statusCode': 401,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Требуется авторизация'})
            }
        
        current_user = get_user_from_token(cursor, session_token)
        if not current_user:
            return {
                'statusCode': 401,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Недействительный токен'})
            }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            image_data = body_data.get('image')
            filename = body_data.get('filename', 'image.jpg')
            
            if not image_data:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Изображение не предоставлено'})
                }
            
            # Проверка размера (примерно 5MB в base64)
            if len(image_data) > 7000000:  # ~5MB
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Изображение слишком большое (макс. 5MB)'})
                }
            
            # Проверка формата
            if not any(image_data.startswith(f'data:image/{fmt};base64,') for fmt in ['jpeg', 'jpg', 'png', 'gif', 'webp']):
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Неподдерживаемый формат изображения'})
                }
            
            try:
                # Сохранение изображения
                image_url = save_image_to_storage(image_data, filename)
                
                return {
                    'statusCode': 200,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'image_url': image_url,
                        'message': 'Изображение загружено успешно'
                    })
                }
                
            except Exception as e:
                return {
                    'statusCode': 500,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': f'Ошибка сохранения изображения: {str(e)}'})
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Метод не поддерживается'})
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