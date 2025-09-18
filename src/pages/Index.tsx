import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Post {
  id: number;
  author: string;
  avatar: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  timestamp: string;
}

interface Story {
  id: number;
  author: string;
  avatar: string;
  viewed: boolean;
}

const Index: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      author: 'Анна Смирнова',
      avatar: '/img/eb0fcbf6-ef28-4bcb-8ff3-9bee03c482e4.jpg',
      content: 'Отличный день для новых начинаний! 🌟 Делюсь с вами моментом счастья и вдохновения.',
      image: '/img/eb8fb71c-4636-4dcf-8eca-09c3dd379ccb.jpg',
      likes: 24,
      comments: 8,
      shares: 3,
      liked: false,
      timestamp: '2 часа назад'
    },
    {
      id: 2,
      author: 'Максим Петров',
      avatar: '/img/eb0fcbf6-ef28-4bcb-8ff3-9bee03c482e4.jpg',
      content: 'Работаю над новым проектом! Скоро покажу результат 🚀',
      likes: 15,
      comments: 5,
      shares: 2,
      liked: true,
      timestamp: '4 часа назад'
    }
  ]);

  const [stories] = useState<Story[]>([
    { id: 1, author: 'Ваша история', avatar: '/img/eb0fcbf6-ef28-4bcb-8ff3-9bee03c482e4.jpg', viewed: false },
    { id: 2, author: 'Анна', avatar: '/img/eb0fcbf6-ef28-4bcb-8ff3-9bee03c482e4.jpg', viewed: false },
    { id: 3, author: 'Максим', avatar: '/img/eb0fcbf6-ef28-4bcb-8ff3-9bee03c482e4.jpg', viewed: true },
    { id: 4, author: 'Елена', avatar: '/img/eb0fcbf6-ef28-4bcb-8ff3-9bee03c482e4.jpg', viewed: false },
    { id: 5, author: 'Дмитрий', avatar: '/img/eb0fcbf6-ef28-4bcb-8ff3-9bee03c482e4.jpg', viewed: true }
  ]);

  const [activeTab, setActiveTab] = useState('home');

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral/10 via-turquoise/10 to-lavender/10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-coral/20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-coral to-turquoise rounded-lg flex items-center justify-center">
              <Icon name="Users" size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-coral to-turquoise bg-clip-text text-transparent">
              SocialSpace
            </h1>
          </div>
          
          <div className="flex-1 max-w-md mx-6">
            <div className="relative">
              <Icon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Поиск друзей, групп, постов..." 
                className="pl-10 bg-gray-50 border-gray-200 focus:border-coral focus:ring-coral"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-coral hover:bg-coral/10">
              <Icon name="Bell" size={20} />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-coral hover:bg-coral/10">
              <Icon name="MessageCircle" size={20} />
            </Button>
            <Avatar className="w-8 h-8 ring-2 ring-coral/30">
              <AvatarImage src="/img/eb0fcbf6-ef28-4bcb-8ff3-9bee03c482e4.jpg" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="mb-6 border-coral/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-12 h-12 ring-2 ring-coral/30">
                  <AvatarImage src="/img/eb0fcbf6-ef28-4bcb-8ff3-9bee03c482e4.jpg" />
                  <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">Мой Профиль</h3>
                  <p className="text-sm text-gray-500">@my_username</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-bold text-coral">248</div>
                  <div className="text-xs text-gray-500">Друзья</div>
                </div>
                <div>
                  <div className="font-bold text-turquoise">1.2K</div>
                  <div className="text-xs text-gray-500">Подписчики</div>
                </div>
                <div>
                  <div className="font-bold text-lavender">86</div>
                  <div className="text-xs text-gray-500">Посты</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <nav className="space-y-2">
            {[
              { id: 'home', label: 'Главная', icon: 'Home' },
              { id: 'friends', label: 'Друзья', icon: 'Users' },
              { id: 'messages', label: 'Сообщения', icon: 'MessageCircle' },
              { id: 'groups', label: 'Группы', icon: 'Users2' },
              { id: 'media', label: 'Медиа', icon: 'Image' },
              { id: 'events', label: 'События', icon: 'Calendar' },
              { id: 'marketplace', label: 'Маркетплейс', icon: 'ShoppingBag' },
              { id: 'settings', label: 'Настройки', icon: 'Settings' }
            ].map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  activeTab === item.id 
                    ? 'bg-gradient-to-r from-coral to-turquoise text-white' 
                    : 'text-gray-600 hover:text-coral hover:bg-coral/10'
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </Button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Stories */}
          <Card className="mb-6 border-coral/20 shadow-lg">
            <CardHeader className="pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Stories</h2>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-4 overflow-x-auto pb-2">
                {stories.map((story) => (
                  <div key={story.id} className="flex-shrink-0 text-center">
                    <div className={`relative mb-2 ${story.viewed ? 'opacity-60' : ''}`}>
                      <Avatar className={`w-16 h-16 ring-3 ${
                        story.viewed ? 'ring-gray-300' : 'ring-gradient-to-r from-coral to-turquoise'
                      } ${!story.viewed ? 'animate-pulse-glow' : ''}`}>
                        <AvatarImage src={story.avatar} />
                        <AvatarFallback>{story.author[0]}</AvatarFallback>
                      </Avatar>
                      {story.id === 1 && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-coral rounded-full flex items-center justify-center">
                          <Icon name="Plus" size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 max-w-[70px] truncate">{story.author}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Create Post */}
          <Card className="mb-6 border-coral/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/img/eb0fcbf6-ef28-4bcb-8ff3-9bee03c482e4.jpg" />
                  <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                <Input 
                  placeholder="Что у вас нового?" 
                  className="flex-1 bg-gray-50 border-gray-200 focus:border-coral"
                />
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-coral hover:bg-coral/10">
                    <Icon name="Image" size={18} className="mr-2" />
                    Фото
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-turquoise hover:bg-turquoise/10">
                    <Icon name="MapPin" size={18} className="mr-2" />
                    Локация
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-lavender hover:bg-lavender/10">
                    <Icon name="Calendar" size={18} className="mr-2" />
                    Событие
                  </Button>
                </div>
                <Button className="bg-gradient-to-r from-coral to-turquoise hover:from-coral/90 hover:to-turquoise/90 text-white">
                  Опубликовать
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="border-coral/20 shadow-lg animate-fade-in">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 ring-2 ring-coral/30">
                        <AvatarImage src={post.avatar} />
                        <AvatarFallback>{post.author[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">{post.author}</h3>
                        <p className="text-sm text-gray-500">{post.timestamp}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                      <Icon name="MoreHorizontal" size={20} />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-gray-800 mb-4 leading-relaxed">{post.content}</p>
                  
                  {post.image && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img 
                        src={post.image} 
                        alt="Post content" 
                        className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-6">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`gap-2 ${post.liked ? 'text-red-500 hover:text-red-600' : 'text-gray-600 hover:text-red-500'}`}
                        onClick={() => handleLike(post.id)}
                      >
                        <Icon name={post.liked ? "Heart" : "Heart"} size={18} fill={post.liked ? "currentColor" : "none"} />
                        {post.likes}
                      </Button>
                      
                      <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-turquoise">
                        <Icon name="MessageCircle" size={18} />
                        {post.comments}
                      </Button>
                      
                      <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-lavender">
                        <Icon name="Share2" size={18} />
                        {post.shares}
                      </Button>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-coral">
                      <Icon name="Bookmark" size={18} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1">
          {/* Online Friends */}
          <Card className="mb-6 border-coral/20 shadow-lg">
            <CardHeader className="pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Друзья онлайн</h2>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {['Анна Смирнова', 'Максим Петров', 'Елена Иванова'].map((friend) => (
                  <div key={friend} className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="/img/eb0fcbf6-ef28-4bcb-8ff3-9bee03c482e4.jpg" />
                        <AvatarFallback>{friend[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <span className="text-sm text-gray-700">{friend}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trending */}
          <Card className="mb-6 border-coral/20 shadow-lg">
            <CardHeader className="pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Тренды</h2>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {[
                  { tag: '#технологии', posts: '2.1K постов' },
                  { tag: '#путешествия', posts: '1.8K постов' },
                  { tag: '#фотография', posts: '1.5K постов' },
                  { tag: '#спорт', posts: '1.2K постов' }
                ].map((trend) => (
                  <div key={trend.tag} className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="font-medium text-coral">{trend.tag}</div>
                    <div className="text-sm text-gray-500">{trend.posts}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Suggested Groups */}
          <Card className="border-coral/20 shadow-lg">
            <CardHeader className="pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Рекомендуемые группы</h2>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {[
                  { name: 'Веб-разработка', members: '15.2K', category: 'Технологии' },
                  { name: 'Фотографы России', members: '8.7K', category: 'Творчество' }
                ].map((group) => (
                  <div key={group.name} className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">{group.name}</h4>
                    <p className="text-sm text-gray-500 mb-2">{group.members} участников</p>
                    <Badge variant="secondary" className="text-xs bg-coral/10 text-coral border-coral/20">
                      {group.category}
                    </Badge>
                    <Button size="sm" className="w-full mt-3 bg-gradient-to-r from-coral to-turquoise text-white">
                      Присоединиться
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;