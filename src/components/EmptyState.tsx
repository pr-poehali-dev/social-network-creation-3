import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  actionText, 
  onAction 
}) => {
  return (
    <Card className="border-coral/20 shadow-lg">
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-coral/20 to-turquoise/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name={icon} size={32} className="text-coral" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
        {actionText && onAction && (
          <Button 
            onClick={onAction}
            className="bg-gradient-to-r from-coral to-turquoise hover:from-coral/90 hover:to-turquoise/90 text-white"
          >
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;