import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface ImageUploadProps {
  onImageSelect: (imageUrl: string) => void;
  onImageRemove: () => void;
  selectedImage?: string;
  sessionToken?: string;
}

const API_UPLOAD_URL = 'https://functions.poehali.dev/ac658339-b5b7-4c6d-b10b-3a1ee74cb631';

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImageSelect, 
  onImageRemove, 
  selectedImage, 
  sessionToken 
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      return;
    }

    // Проверка размера (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер изображения не должен превышать 5MB');
      return;
    }

    setUploading(true);

    try {
      // Конвертация в base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        
        if (!sessionToken) {
          toast.error('Ошибка авторизации');
          setUploading(false);
          return;
        }

        try {
          const response = await fetch(API_UPLOAD_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Auth-Token': sessionToken,
            },
            body: JSON.stringify({
              image: base64Data,
              filename: file.name,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            onImageSelect(data.image_url);
            toast.success('Изображение загружено!');
          } else {
            toast.error(data.error || 'Ошибка загрузки изображения');
          }
        } catch (error) {
          console.error('Ошибка загрузки:', error);
          toast.error('Ошибка загрузки изображения');
        } finally {
          setUploading(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Ошибка чтения файла:', error);
      toast.error('Ошибка чтения файла');
      setUploading(false);
    }

    // Очистка input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {selectedImage ? (
        <div className="relative">
          <img
            src={selectedImage}
            alt="Выбранное изображение"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2"
          >
            <Icon name="X" size={16} />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={uploading}
          className="w-full h-32 border-dashed border-2 flex flex-col items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Icon name="Loader2" className="animate-spin h-6 w-6" />
              <span className="text-sm">Загружаем...</span>
            </>
          ) : (
            <>
              <Icon name="ImagePlus" className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-600">Добавить изображение</span>
              <span className="text-xs text-gray-400">JPEG, PNG, GIF, WebP до 5MB</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default ImageUpload;