import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Post {
  id: number;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  user_id: number;
  username: string;
  full_name: string;
  avatar_url?: string;
  is_verified: boolean;
  is_liked: boolean;
}

const API_POSTS_URL = 'https://functions.poehali.dev/f945012d-fb7c-4e9b-8cb1-0a6aa7d39aec';

const Home = () => {
  const { user, sessionToken, logout, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadPosts();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const loadPosts = async () => {
    try {
      const response = await fetch(API_POSTS_URL, {
        headers: sessionToken ? { 'X-Auth-Token': sessionToken } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки постов:', error);
      toast.error('Ошибка загрузки постов');
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim() || !sessionToken) return;

    setCreating(true);
    try {
      const response = await fetch(`${API_POSTS_URL}?action=create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': sessionToken,
        },
        body: JSON.stringify({ content: newPostContent }),
      });

      if (response.ok) {
        setNewPostContent('');
        loadPosts();
        toast.success('Пост опубликован!');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка создания поста');
      }
    } catch (error) {
      console.error('Ошибка создания поста:', error);
      toast.error('Ошибка создания поста');
    } finally {
      setCreating(false);
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
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'только что';
    if (hours < 24) return `${hours}ч`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}д`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-600">SocialNet</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">@{user?.username}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              <Icon name="LogOut" size={16} className="sm:mr-2" />
              <span className="hidden sm:inline">Выйти</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Create Post */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="text-xs sm:text-sm">{user?.full_name?.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm sm:text-base">{user?.full_name}</p>
                <p className="text-xs sm:text-sm text-gray-500">@{user?.username}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Что у вас нового?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="mb-4 min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-500">
                {newPostContent.length}/500
              </span>
              <Button 
                onClick={createPost}
                disabled={!newPostContent.trim() || creating}
                size="sm"
                className="text-sm"
              >
                {creating ? 'Публикуем...' : 'Опубликовать'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        {loading ? (
          <div className="text-center py-8">
            <Icon name="Loader2" className="animate-spin h-8 w-8 mx-auto mb-4" />
            <p className="text-gray-500">Загружаем посты...</p>
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Icon name="MessageSquare" className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Пока нет постов</h3>
              <p className="text-gray-500">Станьте первым, кто поделится чем-то интересным!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.avatar_url} />
                      <AvatarFallback>{post.full_name?.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{post.full_name}</p>
                        {post.is_verified && (
                          <Badge variant="secondary" className="text-xs">
                            <Icon name="CheckCircle" size={12} className="mr-1" />
                            Проверен
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        @{post.username} · {formatDate(post.created_at)}
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
                        name={post.is_liked ? 'Heart' : 'Heart'} 
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;