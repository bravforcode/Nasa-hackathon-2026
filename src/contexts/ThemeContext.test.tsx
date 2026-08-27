import '../test/setup';
import { describe, expect, it, beforeEach } from 'bun:test';
import { render, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from './ThemeContext';

const TestThemeConsumer: React.FC = () => {
  const { theme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={() => setTheme('light')} data-testid="set-light">Set Light</button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">Set Dark</button>
      <button onClick={() => setTheme('hc')} data-testid="set-hc">Set HC</button>
      <button onClick={toggleTheme} data-testid="toggle-theme">Toggle</button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to dark theme when no storage preference exists', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );

    expect(getByTestId('current-theme').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('initializes from stored localStorage preference for light theme', () => {
    localStorage.setItem('lunar_relay_theme', 'light');

    const { getByTestId } = render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );

    expect(getByTestId('current-theme').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('initializes from stored localStorage preference for hc theme', () => {
    localStorage.setItem('lunar_relay_theme', 'hc');

    const { getByTestId } = render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );

    expect(getByTestId('current-theme').textContent).toBe('hc');
    expect(document.documentElement.getAttribute('data-theme')).toBe('hc');
  });

  it('cycles theme through dark -> light -> hc -> dark', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );

    expect(getByTestId('current-theme').textContent).toBe('dark');

    // dark -> light
    act(() => {
      fireEvent.click(getByTestId('toggle-theme'));
    });
    expect(getByTestId('current-theme').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('lunar_relay_theme')).toBe('light');

    // light -> hc
    act(() => {
      fireEvent.click(getByTestId('toggle-theme'));
    });
    expect(getByTestId('current-theme').textContent).toBe('hc');
    expect(document.documentElement.getAttribute('data-theme')).toBe('hc');
    expect(localStorage.getItem('lunar_relay_theme')).toBe('hc');

    // hc -> dark
    act(() => {
      fireEvent.click(getByTestId('toggle-theme'));
    });
    expect(getByTestId('current-theme').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('lunar_relay_theme')).toBe('dark');
  });

  it('allows setting specific theme directly', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );

    act(() => {
      fireEvent.click(getByTestId('set-light'));
    });
    expect(getByTestId('current-theme').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    act(() => {
      fireEvent.click(getByTestId('set-hc'));
    });
    expect(getByTestId('current-theme').textContent).toBe('hc');
    expect(document.documentElement.getAttribute('data-theme')).toBe('hc');

    act(() => {
      fireEvent.click(getByTestId('set-dark'));
    });
    expect(getByTestId('current-theme').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('throws error when useTheme is consumed without a ThemeProvider', () => {
    expect(() => render(<TestThemeConsumer />)).toThrow('useTheme must be used within a ThemeProvider');
  });
});
