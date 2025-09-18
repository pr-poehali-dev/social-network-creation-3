import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface RegisterFormProps {
  onRegister: (user: any) => void;
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Пароли не совпадают');
      }

      if (formData.password.length < 6) {
        throw new Error('Пароль должен содержать минимум 6 символов');
      }

      // TODO: Заменить на реальный API вызов
      if (formData.email && formData.password && formData.username && formData.fullName) {
        // Симуляция успешной регистрации
        const newUser = {
          id: Date.now(),
          username: formData.username,
          email: formData.email,
          full_name: formData.fullName,
          avatar_url: null
        };
        onRegister(newUser);
        toast({
          title: "Регистрация успешна!",
          description: "Добро пожаловать в SocialSpace",
        });
      } else {
        throw new Error('Заполните все поля');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка регистрации",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-coral/20 shadow-lg">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-gradient-to-r from-coral to-turquoise rounded-lg flex items-center justify-center mx-auto mb-4">
          <Icon name="UserPlus" size={24} className="text-white" />
        </div>
        <CardTitle className="text-2xl bg-gradient-to-r from-coral to-turquoise bg-clip-text text-transparent">
          Регистрация
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Полное имя</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Иван Иванов"
              required
              className="focus:border-coral focus:ring-coral"
            />
          </div>

          <div>
            <Label htmlFor="username">Имя пользователя</Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="ivan_ivanov"
              required
              className="focus:border-coral focus:ring-coral"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ivan@example.com"
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

          <div>
            <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                Регистрация...
              </>
            ) : (
              'Зарегистрироваться'
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-coral hover:text-turquoise text-sm transition-colors"
            >
              Уже есть аккаунт? Войти
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegisterForm;