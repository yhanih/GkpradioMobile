import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './DarkModeToggle.css';

interface DarkModeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ 
  size = 'md', 
  showLabel = false 
}) => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button 
      className={`dark-mode-toggle dark-mode-toggle-${size}`}
      onClick={toggleDarkMode}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? (
        <>
          <Sun size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
          {showLabel && <span>Light Mode</span>}
        </>
      ) : (
        <>
          <Moon size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
          {showLabel && <span>Dark Mode</span>}
        </>
      )}
    </button>
  );
};
