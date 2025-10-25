import { ReactNode } from 'react';
import { Link } from 'wouter';

interface Button3DProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  variant?: 'primary' | 'secondary';
}

const Button3D = ({ children, onClick, href, className = '', variant = 'primary' }: Button3DProps) => {
  const buttonContent = (
    <button 
      className={`button-3d ${variant} ${className}`}
      onClick={href ? undefined : onClick}
      type="button"
    >
      <span className="button-3d-shadow" />
      <span className="button-3d-edge" />
      <div className="button-3d-front flex items-center justify-center">
        {children}
      </div>
    </button>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick}>
        {buttonContent}
      </Link>
    );
  }

  return buttonContent;
};

export default Button3D;