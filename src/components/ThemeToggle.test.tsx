import '../test/setup';
import { describe, expect, it, beforeEach } from 'bun:test';
import { render, fireEvent, act } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders with dark mode initial state and accessible label', () => {
    const { getByRole } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = getByRole('button', { name: /switch to light theme/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Theme: Standard Dark (Click to switch to Light)');
  });

  it('toggles to light theme on click and updates aria-label', () => {
    const { getByRole } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = getByRole('button');
    act(() => {
      fireEvent.click(button);
    });

    expect(button).toHaveAttribute('aria-label', 'Switch to High Contrast Theme');
    expect(button).toHaveAttribute('title', 'Theme: Daylight Light (Click to switch to High Contrast)');
  });

  it('cycles to high contrast theme on next click', () => {
    const { getByRole } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = getByRole('button');
    // dark -> light
    act(() => {
      fireEvent.click(button);
    });
    // light -> hc
    act(() => {
      fireEvent.click(button);
    });

    expect(button).toHaveAttribute('aria-label', 'Switch to Standard Dark Theme');
    expect(button).toHaveAttribute('title', 'Theme: High Contrast (Click to switch to Standard Dark)');
  });
});
