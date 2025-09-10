import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md'
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`bg-panel border border-border text-text rounded-lg shadow-md ${paddingClasses[padding]} ${className}`}>
      {/* Fondo y borde actualizados a la nueva paleta */}
      {children}
    </div>
  );
};