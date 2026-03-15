import { View, ViewProps } from 'react-native';
import React from 'react';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <View
      className={`bg-surface rounded-xl shadow-lg p-4 ${className || ''}`}
      {...props}
    >
      {children}
    </View>
  );
}
