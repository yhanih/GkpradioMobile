import React from 'react';
import { motion } from 'framer-motion';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverable = false,
  padding = 'md',
  className = '',
  onClick,
}) => {
  const baseClass = `card card-${variant}`;
  const hoverClass = hoverable ? 'card-hoverable' : '';
  const paddingClass = `card-padding-${padding}`;
  const combinedClass = `${baseClass} ${hoverClass} ${paddingClass} ${className}`.trim();

  const MotionCard = motion.div;

  return (
    <MotionCard
      className={combinedClass}
      onClick={onClick}
      whileHover={hoverable && onClick ? { y: -4, transition: { duration: 0.2 } } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </MotionCard>
  );
};
