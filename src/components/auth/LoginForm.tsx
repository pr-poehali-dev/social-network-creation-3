import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface LoginFormProps {
  onLogin: (user: any) => void;
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Заменить на реальный API вызов
      if (formData.email && formData.password) {
        // Симуляция успешного входа
        const mockUser = {
          id: 1,
          username: formData.email.split('@')[0],
          email: formData.email,
          full_name: 'Пользователь',
          avatar_url: '/img/eb0fcbf6-ef28-4bcb-8ff3-9bee03c482e4.jpg'
        };
        onLogin(mockUser);
        toast({
          title: "Успешный вход!",
          description: "Добро пожаловать в SocialSpace",
        });
      } else {
        throw new Error('Заполните все поля');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка входа",
        description: "Проверьте email и пароль",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-coral/20 shadow-lg">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-gradient-to-r from-coral to-turquoise rounded-lg flex items-center justify-center mx-auto mb-4">
          <Icon name="Users" size={24} className="text-white" />
        </div>
        <CardTitle className="text-2xl bg-gradient-to-r from-coral to-turquoise bg-clip-text text-transparent">
          Вход в SocialSpace
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              required
              className="focus:border-coral focus:ring-coral"
            />
          </div>
          
          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              className="focus:border-coral focus:ring-coral"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-coral to-turquoise hover:from-coral/90 hover:to-turquoise/90 text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Вход...
              </>
            ) : (
              'Войти'
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-coral hover:text-turquoise text-sm transition-colors"
            >
              Нет аккаунта? Зарегистрироваться
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;