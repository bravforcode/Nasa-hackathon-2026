/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Contrast, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { IconButton } from './ui';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'hc':
        return <Contrast className="w-4 h-4 text-blue-300" />;
      case 'dark':
      default:
        return <Moon className="w-4 h-4" />;
    }
  };

  const getAriaLabel = () => {
    switch (theme) {
      case 'dark':
        return 'Switch to Light Theme';
      case 'light':
        return 'Switch to High Contrast Theme';
      case 'hc':
        return 'Switch to Standard Dark Theme';
    }
  };

  const getTitle = () => {
    switch (theme) {
      case 'dark':
        return 'Theme: Standard Dark (Click to switch to Light)';
      case 'light':
        return 'Theme: Daylight Light (Click to switch to High Contrast)';
      case 'hc':
        return 'Theme: High Contrast (Click to switch to Standard Dark)';
    }
  };

  return (
    <IconButton
      icon={getIcon()}
      aria-label={getAriaLabel()}
      title={getTitle()}
      active={theme !== 'dark'}
      onClick={toggleTheme}
      className={className}
      size="md"
    />
  );
};
