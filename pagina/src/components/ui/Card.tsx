import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = true,
  bordered = true,
}) => {
  const base = 'bg-white rounded-2xl p-4';
  const shadow = hoverable ? 'shadow-md hover:shadow-lg transition-shadow' : 'shadow-md';
  const border = bordered ? 'border border-gray-400' : '';
  return (
    <div className={` ${base} ${shadow} ${border} ${className}`}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => {
  return <div className={` p-3 sm:p-6 text-gray-700 ${className}`}>{children}</div>;
};