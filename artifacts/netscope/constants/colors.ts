import { themes } from './theme';

const colors = {
  light: {
    ...themes.light,
    text: themes.light.textPrimary,
    tint: themes.light.primary,
    background: themes.light.bg,
    foreground: themes.light.textPrimary,
    card: themes.light.bgSurface,
    cardForeground: themes.light.textPrimary,
    primaryForeground: '#FFFFFF',
    muted: themes.light.bgElevated,
    mutedForeground: themes.light.textSecondary,
    accentForeground: themes.light.textPrimary,
    destructive: themes.light.error,
    destructiveForeground: '#ffffff',
    input: themes.light.bgInput,
  },
  dark: {
    ...themes.dark,
    text: themes.dark.textPrimary,
    tint: themes.dark.primary,
    background: themes.dark.bg,
    foreground: themes.dark.textPrimary,
    card: themes.dark.bgSurface,
    cardForeground: themes.dark.textPrimary,
    primaryForeground: themes.dark.textInverse,
    muted: themes.dark.bgElevated,
    mutedForeground: themes.dark.textSecondary,
    accentForeground: themes.dark.textPrimary,
    destructive: themes.dark.error,
    destructiveForeground: '#ffffff',
    input: themes.dark.bgInput,
  },
  radius: 12,
};

export default colors;
