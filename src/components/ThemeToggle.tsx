/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Contrast } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { IconButton } from './ui';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isHighContrast = theme === 'hc';

  return (
    <IconButton
      icon={<Contrast className="w-4 h-4" />}
      aria-label={`Switch to ${isHighContrast ? 'Standard Dark' : 'High Contrast'} Theme`}
      title={`Theme: ${isHighContrast ? 'High Contrast Mode (Active)' : 'Standard Dark'}`}
      active={isHighContrast}
      onClick={toggleTheme}
      className={className}
      size="md"
    />
  );
};
