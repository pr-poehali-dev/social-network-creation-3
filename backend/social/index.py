'''
API для социальных функций - подписки, друзья, поиск пользователей
Обрабатывает подписки, отписки, поиск и профили пользователей
'''

import json
import os
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
    Обработка социальных запросов
    POST /?action=follow - подписка на пользователя
    POST /?action=unfollow - отписка от пользователя
    GET /?action=followers&user_id=X - получение подписчиков
    GET /?action=following&user_id=X - получение подписок
    GET /?action=search&q=query - поиск пользователей
    GET /?action=profile&user_id=X - получение профиля пользователя
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
        
        if method == 'POST' and action == 'follow':
            # Подписка на пользователя
            if not current_user:
                return {
                    'statusCode': 401,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Требуется авторизация'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            following_id = body_data.get('user_id')
            
            if not following_id:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'ID пользователя не указан'})
                }
            
            if current_user['id'] == following_id:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Нельзя подписаться на самого себя'})
                }
            
            # Проверка существования подписки
            cursor.execute("""
                SELECT id FROM user_follows 
                WHERE follower_id = %s AND following_id = %s
            """, (current_user['id'], following_id))
            
            if cursor.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Вы уже подписаны на этого пользователя'})
                }
            
            # Создание подписки
            cursor.execute("""
                INSERT INTO user_follows (follower_id, following_id)
                VALUES (%s, %s)
            """, (current_user['id'], following_id))
            
            # Обновление счетчиков
            cursor.execute("""
                UPDATE users SET following_count = following_count + 1 
                WHERE id = %s
            """, (current_user['id'],))
            
            cursor.execute("""
                UPDATE users SET followers_count = followers_count + 1 
                WHERE id = %s
            """, (following_id,))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'message': 'Подписка оформлена', 'is_following': True})
            }
        
        elif method == 'POST' and action == 'unfollow':
            # Отписка от пользователя
            if not current_user:
                return {
                    'statusCode': 401,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Требуется авторизация'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            following_id = body_data.get('user_id')
            
            if not following_id:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'ID пользователя не указан'})
                }
            
            # Удаление подписки
            cursor.execute("""
                DELETE FROM user_follows 
                WHERE follower_id = %s AND following_id = %s
            """, (current_user['id'], following_id))
            
            if cursor.rowcount > 0:
                # Обновление счетчиков
                cursor.execute("""
                    UPDATE users SET following_count = following_count - 1 
                    WHERE id = %s
                """, (current_user['id'],))
                
                cursor.execute("""
                    UPDATE users SET followers_count = followers_count - 1 
                    WHERE id = %s
                """, (following_id,))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'message': 'Отписка выполнена', 'is_following': False})
                }
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Вы не подписаны на этого пользователя'})
                }
        
        elif method == 'GET' and action == 'followers':
            # Получение подписчиков пользователя
            user_id = query_params.get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'ID пользователя не указан'})
                }
            
            cursor.execute("""
                SELECT u.id, u.username, u.full_name, u.avatar_url, u.is_verified,
                       CASE WHEN f2.follower_id IS NOT NULL THEN true ELSE false END as is_following
                FROM user_follows f1
                JOIN users u ON f1.follower_id = u.id
                LEFT JOIN user_follows f2 ON u.id = f2.following_id AND f2.follower_id = %s
                WHERE f1.following_id = %s
                ORDER BY f1.created_at DESC
            """, (current_user['id'] if current_user else None, user_id))
            
            followers = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'followers': [dict(follower) for follower in followers]
                })
            }
        
        elif method == 'GET' and action == 'following':
            # Получение подписок пользователя
            user_id = query_params.get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'ID пользователя не указан'})
                }
            
            cursor.execute("""
                SELECT u.id, u.username, u.full_name, u.avatar_url, u.is_verified,
                       CASE WHEN f2.follower_id IS NOT NULL THEN true ELSE false END as is_following
                FROM user_follows f1
                JOIN users u ON f1.following_id = u.id
                LEFT JOIN user_follows f2 ON u.id = f2.following_id AND f2.follower_id = %s
                WHERE f1.follower_id = %s
                ORDER BY f1.created_at DESC
            """, (current_user['id'] if current_user else None, user_id))
            
            following = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'following': [dict(follow) for follow in following]
                })
            }
        
        elif method == 'GET' and action == 'search':
            # Поиск пользователей
            query = query_params.get('q', '').strip()
            
            if not query:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Поисковый запрос не указан'})
                }
            
            cursor.execute("""
                SELECT u.id, u.username, u.full_name, u.avatar_url, u.is_verified,
                       u.followers_count, u.posts_count,
                       CASE WHEN f.follower_id IS NOT NULL THEN true ELSE false END as is_following
                FROM users u
                LEFT JOIN user_follows f ON u.id = f.following_id AND f.follower_id = %s
                WHERE u.username ILIKE %s OR u.full_name ILIKE %s
                ORDER BY u.followers_count DESC, u.username ASC
                LIMIT 20
            """, (current_user['id'] if current_user else None, f'%{query}%', f'%{query}%'))
            
            users = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'users': [dict(user) for user in users]
                })
            }
        
        elif method == 'GET' and action == 'profile':
            # Получение профиля пользователя
            user_id = query_params.get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'ID пользователя не указан'})
                }
            
            # Получение данных пользователя
            cursor.execute("""
                SELECT u.id, u.username, u.full_name, u.bio, u.avatar_url, u.is_verified,
                       u.followers_count, u.following_count, u.posts_count, u.created_at,
                       CASE WHEN f.follower_id IS NOT NULL THEN true ELSE false END as is_following
                FROM users u
                LEFT JOIN user_follows f ON u.id = f.following_id AND f.follower_id = %s
                WHERE u.id = %s
            """, (current_user['id'] if current_user else None, user_id))
            
            user = cursor.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Пользователь не найден'})
                }
            
            # Получение последних постов пользователя
            cursor.execute("""
                SELECT p.id, p.content, p.image_url, p.likes_count, p.comments_count, 
                       p.shares_count, p.created_at,
                       CASE WHEN pl.user_id IS NOT NULL THEN true ELSE false END as is_liked
                FROM posts p
                LEFT JOIN post_likes pl ON p.id = pl.post_id AND pl.user_id = %s
                WHERE p.user_id = %s
                ORDER BY p.created_at DESC
                LIMIT 12
            """, (current_user['id'] if current_user else None, user_id))
            
            posts = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'user': dict(user),
                    'posts': [dict(post) for post in posts]
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