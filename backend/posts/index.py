'''
API для работы с постами социальной сети
Обрабатывает создание, получение, лайки и комментарии к постам
'''

import json
import os
from datetime import datetime
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

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Обработка запросов для работы с постами
    GET / - получение ленты постов
    POST /?action=create - создание нового поста
    POST /?action=like - лайк/дизлайк поста
    POST /?action=comment - добавление комментария
    GET /?action=comments&post_id=X - получение комментариев поста
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
        
        # Получение токена авторизации
        headers = event.get('headers', {})
        session_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
        current_user = None
        
        if session_token:
            current_user = get_user_from_token(cursor, session_token)
        
        if method == 'GET' and not action:
            # Получение ленты постов
            page = int(query_params.get('page', 1))
            limit = min(int(query_params.get('limit', 20)), 50)
            offset = (page - 1) * limit
            
            cursor.execute("""
                SELECT p.id, p.content, p.image_url, p.likes_count, p.comments_count, 
                       p.shares_count, p.created_at,
                       u.id as user_id, u.username, u.full_name, u.avatar_url, u.is_verified,
                       CASE WHEN pl.user_id IS NOT NULL THEN true ELSE false END as is_liked
                FROM posts p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN post_likes pl ON p.id = pl.post_id AND pl.user_id = %s
                ORDER BY p.created_at DESC
                LIMIT %s OFFSET %s
            """, (current_user['id'] if current_user else None, limit, offset))
            
            posts = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'posts': [dict(post) for post in posts],
                    'page': page,
                    'limit': limit
                })
            }
        
        elif method == 'POST' and action == 'create':
            # Создание нового поста
            if not current_user:
                return {
                    'statusCode': 401,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Требуется авторизация'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            content = body_data.get('content', '').strip()
            image_url = body_data.get('image_url', '')
            
            if not content and not image_url:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Пост должен содержать текст или изображение'})
                }
            
            # Создание поста
            cursor.execute("""
                INSERT INTO posts (user_id, content, image_url)
                VALUES (%s, %s, %s)
                RETURNING id, content, image_url, likes_count, comments_count, shares_count, created_at
            """, (current_user['id'], content, image_url))
            
            post = cursor.fetchone()
            
            # Обновление счетчика постов пользователя
            cursor.execute("""
                UPDATE users SET posts_count = posts_count + 1 
                WHERE id = %s
            """, (current_user['id'],))
            
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'post': dict(post),
                    'user': dict(current_user),
                    'message': 'Пост создан успешно'
                })
            }
        
        elif method == 'POST' and action == 'like':
            # Лайк/дизлайк поста
            if not current_user:
                return {
                    'statusCode': 401,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Требуется авторизация'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            post_id = body_data.get('post_id')
            
            if not post_id:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'ID поста не указан'})
                }
            
            # Проверка существования лайка
            cursor.execute("""
                SELECT id FROM post_likes 
                WHERE post_id = %s AND user_id = %s
            """, (post_id, current_user['id']))
            
            existing_like = cursor.fetchone()
            
            if existing_like:
                # Удаление лайка
                cursor.execute("""
                    DELETE FROM post_likes 
                    WHERE post_id = %s AND user_id = %s
                """, (post_id, current_user['id']))
                
                cursor.execute("""
                    UPDATE posts SET likes_count = likes_count - 1 
                    WHERE id = %s
                """, (post_id,))
                
                is_liked = False
            else:
                # Добавление лайка
                cursor.execute("""
                    INSERT INTO post_likes (post_id, user_id) 
                    VALUES (%s, %s)
                """, (post_id, current_user['id']))
                
                cursor.execute("""
                    UPDATE posts SET likes_count = likes_count + 1 
                    WHERE id = %s
                """, (post_id,))
                
                is_liked = True
            
            # Получение нового количества лайков
            cursor.execute("""
                SELECT likes_count FROM posts WHERE id = %s
            """, (post_id,))
            
            result = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'is_liked': is_liked,
                    'likes_count': result['likes_count']
                })
            }
        
        elif method == 'POST' and action == 'comment':
            # Добавление комментария
            if not current_user:
                return {
                    'statusCode': 401,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Требуется авторизация'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            post_id = body_data.get('post_id')
            content = body_data.get('content', '').strip()
            parent_comment_id = body_data.get('parent_comment_id')
            
            if not post_id or not content:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'ID поста и содержание комментария обязательны'})
                }
            
            # Создание комментария
            cursor.execute("""
                INSERT INTO post_comments (post_id, user_id, content, parent_comment_id)
                VALUES (%s, %s, %s, %s)
                RETURNING id, content, likes_count, created_at
            """, (post_id, current_user['id'], content, parent_comment_id))
            
            comment = cursor.fetchone()
            
            # Обновление счетчика комментариев поста
            cursor.execute("""
                UPDATE posts SET comments_count = comments_count + 1 
                WHERE id = %s
            """, (post_id,))
            
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'comment': dict(comment),
                    'user': dict(current_user),
                    'message': 'Комментарий добавлен'
                })
            }
        
        elif method == 'GET' and action == 'comments':
            # Получение комментариев поста
            post_id = query_params.get('post_id')
            
            if not post_id:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'ID поста не указан'})
                }
            
            cursor.execute("""
                SELECT c.id, c.content, c.likes_count, c.created_at, c.parent_comment_id,
                       u.id as user_id, u.username, u.full_name, u.avatar_url
                FROM post_comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.post_id = %s
                ORDER BY c.created_at ASC
            """, (post_id,))
            
            comments = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'comments': [dict(comment) for comment in comments]
                })
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