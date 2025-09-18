import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface UserProfile {
  id: number;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  is_verified: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  is_following: boolean;
}

interface Post {
  id: number;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  is_liked: boolean;
}

const API_SOCIAL_URL = 'https://functions.poehali.dev/c145ace6-bf3a-473a-8903-85522e69b282';
const API_POSTS_URL = 'https://functions.poehali.dev/f945012d-fb7c-4e9b-8cb1-0a6aa7d39aec';

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, sessionToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_SOCIAL_URL}?action=profile&user_id=${userId}`, {
        headers: sessionToken ? { 'X-Auth-Token': sessionToken } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setPosts(data.posts || []);
      } else {
        toast.error('Пользователь не найден');
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      toast.error('Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (!profile || !sessionToken) return;

    setFollowLoading(true);
    try {
      const action = profile.is_following ? 'unfollow' : 'follow';
      const response = await fetch(`${API_SOCIAL_URL}?action=${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': sessionToken,
        },
        body: JSON.stringify({ user_id: profile.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({
          ...profile,
          is_following: data.is_following,
          followers_count: profile.followers_count + (data.is_following ? 1 : -1)
        });
        toast.success(data.message);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка');
      }
    } catch (error) {
      console.error('Ошибка подписки:', error);
      toast.error('Ошибка подписки');
    } finally {
      setFollowLoading(false);
    }
  };

  const toggleLike = async (postId: number) => {
    if (!sessionToken) return;

    try {
      const response = await fetch(`${API_POSTS_URL}?action=like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': sessionToken,
        },
        body: JSON.stringify({ post_id: postId }),
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, is_liked: data.is_liked, likes_count: data.likes_count }
            : post
        ));
      }
    } catch (error) {
      console.error('Ошибка лайка:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'только что';
    if (hours < 24) return `${hours}ч`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}д`;
    return date.toLocaleDateString('ru-RU');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <Icon name="UserX" className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Пользователь не найден</h3>
            <p className="text-gray-500">Возможно, пользователь не существует</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Назад
          </Button>
          <h1 className="text-lg font-semibold">{profile.full_name}</h1>
          <div></div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-lg">
                  {profile.full_name?.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold">{profile.full_name}</h1>
                  {profile.is_verified && (
                    <Badge variant="secondary" className="text-xs">
                      <Icon name="CheckCircle" size={12} className="mr-1" />
                      Проверен
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 mb-2">@{profile.username}</p>
                
                {profile.bio && (
                  <p className="text-gray-900 mb-3">{profile.bio}</p>
                )}
                
                <p className="text-sm text-gray-500 mb-4">
                  <Icon name="Calendar" size={14} className="inline mr-1" />
                  Регистрация: {formatDate(profile.created_at)}
                </p>
                
                <div className="flex gap-4 mb-4">
                  <span className="text-sm">
                    <strong>{profile.following_count}</strong> подписок
                  </span>
                  <span className="text-sm">
                    <strong>{profile.followers_count}</strong> подписчиков
                  </span>
                  <span className="text-sm">
                    <strong>{profile.posts_count}</strong> постов
                  </span>
                </div>
                
                {!isOwnProfile && currentUser && (
                  <Button
                    onClick={toggleFollow}
                    disabled={followLoading}
                    variant={profile.is_following ? "outline" : "default"}
                    className="w-full sm:w-auto"
                  >
                    {followLoading ? (
                      <Icon name="Loader2" className="animate-spin h-4 w-4 mr-2" />
                    ) : profile.is_following ? (
                      <>
                        <Icon name="UserMinus" size={16} className="mr-2" />
                        Отписаться
                      </>
                    ) : (
                      <>
                        <Icon name="UserPlus" size={16} className="mr-2" />
                        Подписаться
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Посты</h2>
          
          {posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Icon name="MessageSquare" className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Нет постов</h3>
                <p className="text-gray-500">
                  {isOwnProfile ? 'Вы еще не создали ни одного поста' : 'Пользователь еще не создал ни одного поста'}
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback>{profile.full_name?.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{profile.full_name}</p>
                        {profile.is_verified && (
                          <Badge variant="secondary" className="text-xs">
                            <Icon name="CheckCircle" size={12} className="mr-1" />
                            Проверен
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        @{profile.username} · {formatPostDate(post.created_at)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-900 mb-4 whitespace-pre-wrap">{post.content}</p>
                  
                  {post.image_url && (
                    <img 
                      src={post.image_url} 
                      alt="Post image" 
                      className="w-full rounded-lg mb-4 max-h-96 object-cover"
                    />
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(post.id)}
                      className={post.is_liked ? 'text-red-500' : 'text-gray-500'}
                    >
                      <Icon 
                        name="Heart" 
                        size={16} 
                        className={post.is_liked ? 'fill-current' : ''}
                      />
                      {post.likes_count}
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="text-gray-500">
                      <Icon name="MessageCircle" size={16} />
                      {post.comments_count}
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="text-gray-500">
                      <Icon name="Share" size={16} />
                      {post.shares_count}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;