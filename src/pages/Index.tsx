import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import EmptyState from '@/components/EmptyState';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
}

const Index: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState('home');

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleRegister = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Если пользователь не авторизован, показываем формы входа/регистрации
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-coral/10 via-turquoise/10 to-lavender/10 flex items-center justify-center p-4">
        {authMode === 'login' ? (
          <LoginForm 
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthMode('register')}
          />
        ) : (
          <RegisterForm 
            onRegister={handleRegister}
            onSwitchToLogin={() => setAuthMode('login')}
          />
        )}
      </div>
    );
  }

  // Авторизованный пользователь видит социальную сеть
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-coral hover:bg-coral/10"
              onClick={handleLogout}
            >
              <Icon name="LogOut" size={20} />
            </Button>
            <Avatar className="w-8 h-8 ring-2 ring-coral/30">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>{user.full_name[0]}</AvatarFallback>
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
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-bold text-coral">{user.following_count || 0}</div>
                  <div className="text-xs text-gray-500">Друзья</div>
                </div>
                <div>
                  <div className="font-bold text-turquoise">{user.followers_count || 0}</div>
                  <div className="text-xs text-gray-500">Подписчики</div>
                </div>
                <div>
                  <div className="font-bold text-lavender">{user.posts_count || 0}</div>
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
          {/* Stories - Empty State */}
          <Card className="mb-6 border-coral/20 shadow-lg">
            <CardHeader className="pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Stories</h2>
            </CardHeader>
            <CardContent className="pt-0">
              <EmptyState
                icon="Camera"
                title="Пока нет историй"
                description="Добавьте свою первую историю, чтобы поделиться моментом с друзьями"
                actionText="Добавить историю"
                onAction={() => alert('Функция добавления историй будет добавлена!')}
              />
            </CardContent>
          </Card>

          {/* Create Post */}
          <Card className="mb-6 border-coral/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                </Avatar>
                <Input 
                  placeholder={`Что нового, ${user.full_name.split(' ')[0]}?`}
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

          {/* Posts Feed - Empty State */}
          <EmptyState
            icon="FileText"
            title="Лента пуста"
            description="Здесь будут отображаться посты ваших друзей. Добавьте друзей или создайте первый пост!"
            actionText="Найти друзей"
            onAction={() => setActiveTab('friends')}
          />
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1">
          {/* Online Friends - Empty State */}
          <Card className="mb-6 border-coral/20 shadow-lg">
            <CardHeader className="pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Друзья онлайн</h2>
            </CardHeader>
            <CardContent className="pt-0">
              <EmptyState
                icon="UserPlus"
                title="Нет друзей онлайн"
                description="Добавьте друзей, чтобы видеть их активность"
              />
            </CardContent>
          </Card>

          {/* Trending - Empty State */}
          <Card className="mb-6 border-coral/20 shadow-lg">
            <CardHeader className="pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Тренды</h2>
            </CardHeader>
            <CardContent className="pt-0">
              <EmptyState
                icon="TrendingUp"
                title="Нет трендов"
                description="Тренды появятся, когда пользователи начнут активно публиковать контент"
              />
            </CardContent>
          </Card>

          {/* Suggested Groups - Empty State */}
          <Card className="border-coral/20 shadow-lg">
            <CardHeader className="pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Рекомендуемые группы</h2>
            </CardHeader>
            <CardContent className="pt-0">
              <EmptyState
                icon="Users"
                title="Нет групп"
                description="Создайте первую группу по интересам"
                actionText="Создать группу"
                onAction={() => setActiveTab('groups')}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;