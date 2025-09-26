
import React, { useEffect, useState } from 'react';
import type { NotificationType } from '../types';
import { Icon } from './icons';

interface NotificationProps {
  message: string;
  type: NotificationType;
}

export const Notification: React.FC<NotificationProps> = ({ message, type }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setIsVisible(false), 4500); // Start fade out before removal
    return () => clearTimeout(timer);
  }, []);

  const baseClasses = "flex items-center space-x-3 p-4 rounded-lg shadow-lg text-white max-w-sm transition-all duration-500 ease-out";

  const typeClasses: { [key in NotificationType]: string } = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  const icons: { [key in NotificationType]: string } = {
    success: 'success',
    error: 'error',
    info: 'info',
  }

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <Icon name={icons[type]} className="w-6 h-6 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};
