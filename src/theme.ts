import { useEffect, useState } from 'react';

/**
 * Light, dark, or whatever the operating system says.
 *
 * The design system has no theme provider: the theme is a `data-theme`
 * attribute on `<html>`, read by its token stylesheet, and with no attribute
 * the tokens follow `prefers-color-scheme`. So "System" is not a third theme —
 * it is the absence of a choice, and it is expressed by removing the attribute
 * rather than by reading the media query and copying its answer, which would
 * stop following the OS the moment the reader changed it.
 *
 * `index.html` applies the stored choice before the first paint. This file
 * keeps it in step afterwards; the two must agree on the key and the values.
 */
export type ThemeChoice = 'system' | 'light' | 'dark';

export const THEME_OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const STORAGE_KEY = 'documanager.theme';

function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === 'system' || value === 'light' || value === 'dark';
}

/**
 * `?theme=dark` wins over the stored choice and is not stored. It exists so a
 * screenshot run can ask for a theme without touching the reader's setting —
 * see `themes` in `.claude/handoff.json`.
 */
function fromQuery(): ThemeChoice | null {
  const value = new URLSearchParams(window.location.search).get('theme');
  return isThemeChoice(value) ? value : null;
}

function readStored(): ThemeChoice {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isThemeChoice(value) ? value : 'system';
  } catch {
    // Storage can refuse (private browsing, a locked-down kiosk). The theme is
    // a convenience, so the app falls back to the OS rather than warning.
    return 'system';
  }
}

function apply(choice: ThemeChoice) {
  if (choice === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', choice);
}

export function useTheme() {
  const [fromUrl] = useState(fromQuery);
  const [theme, setTheme] = useState<ThemeChoice>(() => fromUrl ?? readStored());

  useEffect(() => {
    apply(theme);
    if (fromUrl) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // See readStored: losing the preference on reload is acceptable.
    }
  }, [theme, fromUrl]);

  return [theme, setTheme] as const;
}
