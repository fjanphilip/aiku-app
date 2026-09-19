// ============================================================
// Premium Design System — "Ethereal Glass" (SaaS / AI / Tech)
// Vibe Archetype 1: Deepest OLED black, radial mesh gradients,
// hairline borders, heavy glass. Motion: EASE_PREMIUM bezier.
// ============================================================

export interface ColorPalette {
  background: string;
  card: string;
  elevated: string;
  paper: string;
}

export interface ThemeTokens {
  colors: {
    background: ColorPalette;
    primary: string;
    primaryDim: string;
    primarySoft: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    border: {
      hairline: string;
      weak: string;
      medium: string;
    };
    surfaceDark: string;
    surfaceLight: string;
    success: string;
    error: string;
    warning: string;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
    pill: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
  };
}

export const COLORS = {
  // Stitch Minimalist UI — Warm Matte Charcoal & Zinc Base
  surfaceBase: '#121214',
  surfaceContainer: '#201f21',
  surfaceContainerHigh: '#2a2a2c',
  surfaceContainerHighest: '#353437',
  surfaceElevated: '#242429',
  oledBlack: '#121214',
  cardBlack: '#201f21',
  surfaceLight: '#242429',
  surfaceLighter: '#2a2a2c',
  paperCream: '#F4F4F6',

  // Warm Golden Amber Primary Accent
  primary: '#FFC72C',
  primaryDim: 'rgba(255, 199, 44, 0.15)',
  primarySoft: '#f6bf22',
  accentYellow: '#FFC72C',
  onAccentYellow: '#1A1400',
  accentYellowContainer: '#2A2412',

  // Text hierarchy
  textPrimary: '#F4F4F6',
  textSecondary: '#9E9EA7',
  textMuted: '#71717A',

  // Structural hairline borders
  borderSubtle: '#2E2E36',
  borderStrong: '#3F3F4A',
  hairline: '#2E2E36',
  hairlineWeak: 'rgba(255, 255, 255, 0.05)',
  hairlineMedium: '#3F3F4A',

  // Status accents
  success: '#10B981',
  error: '#EF4444',
  warning: '#FFC72C',
} as const;

export const RADIUS = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
  // Double-Bezel: outer shell radius minus inner padding inset
  doppelOuter: 32,
  doppelInner: 28,
  pill: 999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
  '5xl': 128,
} as const;

// Typography scale — wide Grotesk personality. On-device system
// fonts with tight negative tracking for headlines; generous
// spacing for micro-labels. (Banned fonts excluded by design.)
export const TYPOGRAPHY = {
  display: {
    fontSize: 40,
    fontWeight: '700' as const,
    lineHeight: 46,
    letterSpacing: -1.6,
  },
  h1: {
    fontSize: 30,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.9,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 21,
    letterSpacing: 0,
  },
  bodyStrong: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 21,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  micro: {
    fontSize: 10,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
  },
} as const;

// Custom cubic-bezier: ease-[cubic-bezier(0.32,0.72,0,1)]
// Simulates real-world mass and spring physics.
export const MOTION = {
  easePremium: 'cubic-bezier(0.32, 0.72, 0, 1)',
  easeSpring: 'cubic-bezier(0.4, 0, 0.2, 1)',
  durationFade: 800,
  durationSpring: 500,
  durationSmooth: 300,
} as const;

export const DESIGN_TOKENS: ThemeTokens = {
  colors: {
    background: {
      background: COLORS.oledBlack,
      card: COLORS.cardBlack,
      elevated: COLORS.surfaceLight,
      paper: COLORS.paperCream,
    },
    primary: COLORS.primary,
    primaryDim: COLORS.primaryDim,
    primarySoft: COLORS.primarySoft,
    text: {
      primary: COLORS.textPrimary,
      secondary: COLORS.textSecondary,
      muted: COLORS.textMuted,
    },
    border: {
      hairline: COLORS.hairline,
      weak: COLORS.hairlineWeak,
      medium: COLORS.hairlineMedium,
    },
    surfaceDark: COLORS.surfaceLight,
    surfaceLight: COLORS.surfaceLighter,
    success: COLORS.success,
    error: COLORS.error,
    warning: COLORS.warning,
  },
  borderRadius: {
    small: RADIUS.small,
    medium: RADIUS.medium,
    large: RADIUS.large,
    xlarge: RADIUS.xlarge,
    pill: RADIUS.pill,
  },
  spacing: {
    xs: SPACING.xs,
    sm: SPACING.sm,
    md: SPACING.md,
    lg: SPACING.lg,
    xl: SPACING.xl,
    '2xl': SPACING['2xl'],
    '3xl': SPACING['3xl'],
  },
};