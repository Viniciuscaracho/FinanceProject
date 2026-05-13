// Design tokens — CSS variables resolve to light/dark values automatically
// bg, white, text, muted, border, light, chip track the active theme.
// Status colors (green, amber, red) and brand are kept as hex since they're
// used in alpha-append patterns (T.green + '18') that require a hex string.
export const T = {
  bg:     'var(--surface)',
  white:  'var(--surface-elevated)',
  hero:   '#1E2440',
  brand:  '#4C60AA',
  text:   'var(--text-primary)',
  muted:  'var(--text-secondary)',
  border: 'var(--border)',
  light:  'var(--surface-subtle)',
  chip:   'var(--chip)',
  green:  '#10B981',
  amber:  '#F59E0B',
  red:    '#EF4444',
}

export const DISPLAY = { fontFamily: "'Space Grotesk', system-ui, sans-serif" }
