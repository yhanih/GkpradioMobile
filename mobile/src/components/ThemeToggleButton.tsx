import * as Haptics from 'expo-haptics';
import { AnimatedThemeToggle } from './animated-theme-toggle';
import { useTheme } from '../contexts/ThemeContext';

type ThemeToggleButtonProps = {
  size?: number;
  duration?: number;
};

export function ThemeToggleButton({ size = 28, duration = 500 }: ThemeToggleButtonProps) {
  const { isDark, toggleTheme, theme } = useTheme();

  return (
    <AnimatedThemeToggle
      isDark={isDark}
      onToggle={() => {
        void Haptics.selectionAsync();
        toggleTheme();
      }}
      size={size}
      duration={duration}
      color={theme.colors.text}
      style={{
        padding: 8,
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    />
  );
}
