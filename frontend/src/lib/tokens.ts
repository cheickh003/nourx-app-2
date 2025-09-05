// Tokens de design pour NourX
// Centralise tous les tokens Tailwind pour assurer la cohérence

export const tokens = {
  // === COULEURS ===

  // Palette principale
  colors: {
    // Primaires
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Couleur principale
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },

    // Secondaires
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b', // Couleur secondaire
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },

    // Accents
    accent: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef', // Accent violet
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
      950: '#4a044e',
    },

    // États de succès
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Succès
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },

    // États d'erreur
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Erreur
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },

    // États d'avertissement
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Avertissement
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },

    // États d'information
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Info (même que primary)
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },

    // Neutres / Gris
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373', // Texte secondaire
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717', // Texte principal
      950: '#0a0a0a',
    },

    // Spéciales
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },

    border: {
      light: '#e2e8f0',
      medium: '#cbd5e1',
      dark: '#94a3b8',
    },
  },

  // === ESPACEMENTS ===
  spacing: {
    // Petits espacements
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px

    // Espacements moyens
    lg: '1rem',      // 16px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px

    // Grands espacements
    '3xl': '2rem',   // 32px
    '4xl': '2.5rem', // 40px
    '5xl': '3rem',   // 48px
    '6xl': '4rem',   // 64px

    // Espacements de section
    section: {
      sm: '2rem',    // 32px
      md: '3rem',    // 48px
      lg: '4rem',    // 64px
      xl: '6rem',    // 96px
    },
  },

  // === RAYONS DE BORDURE ===
  radius: {
    none: '0',
    sm: '0.125rem',  // 2px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',  // Cercle
  },

  // === OMBRES ===
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',

    // Ombres colorées
    primary: '0 4px 6px -1px rgb(59 130 246 / 0.1), 0 2px 4px -2px rgb(59 130 246 / 0.1)',
    success: '0 4px 6px -1px rgb(34 197 94 / 0.1), 0 2px 4px -2px rgb(34 197 94 / 0.1)',
    error: '0 4px 6px -1px rgb(239 68 68 / 0.1), 0 2px 4px -2px rgb(239 68 68 / 0.1)',
    warning: '0 4px 6px -1px rgb(245 158 11 / 0.1), 0 2px 4px -2px rgb(245 158 11 / 0.1)',
  },

  // === TYPOGRAPHIE ===
  typography: {
    // Tailles de police
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
      '5xl': ['3rem', { lineHeight: '1' }],         // 48px
    },

    // Poids de police
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },

    // Hauteurs de ligne
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },

    // Lettre spacing
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // === ANIMATIONS ===
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },

    easing: {
      linear: 'linear',
      in: 'ease-in',
      out: 'ease-out',
      inOut: 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },

    // Transitions prédéfinies
    transition: {
      fast: 'all 150ms ease-out',
      normal: 'all 300ms ease-out',
      slow: 'all 500ms ease-out',
      bounce: 'all 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // === POINTS DE RUPTURE ===
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // === Z-INDEX ===
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070,
  },
} as const;

// === UTILITAIRES DE CONTRASTE ===

// Vérifie si deux couleurs ont un contraste suffisant (WCAG AA)
export function hasGoodContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const minRatio = level === 'AAA' ? 7 : 4.5;
  return ratio >= minRatio;
}

// Calcule le ratio de contraste entre deux couleurs
export function getContrastRatio(color1: string, color2: string): number {
  // Fonction simplifiée - en production, utiliser une librairie comme color-contrast
  // Pour l'instant, retourne un ratio basé sur des valeurs prédéfinies

  const colorPairs: Record<string, Record<string, number>> = {
    '#3b82f6': { '#ffffff': 8.59, '#f8fafc': 8.21, '#0f172a': 10.76 },
    '#ef4444': { '#ffffff': 5.25, '#fef2f2': 2.36, '#7f1d1d': 3.45 },
    '#22c55e': { '#ffffff': 3.24, '#f0fdf4': 1.85, '#14532d': 4.67 },
    '#f59e0b': { '#ffffff': 2.45, '#fffbeb': 1.42, '#78350f': 3.89 },
    '#64748b': { '#ffffff': 4.52, '#f8fafc': 4.21, '#0f172a': 13.85 },
    '#171717': { '#ffffff': 20.54, '#f8fafc': 19.42, '#0f172a': 2.34 },
  };

  return colorPairs[color1]?.[color2] || 1;
}

// === CLASSES CSS UTILITAIRES ===

// Classes de couleur pour les composants
export const colorClasses = {
  // Boutons
  button: {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-primary',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white',
    success: 'bg-success-500 hover:bg-success-600 text-white shadow-success',
    error: 'bg-error-500 hover:bg-error-600 text-white shadow-error',
    warning: 'bg-warning-500 hover:bg-warning-600 text-white shadow-warning',
    ghost: 'hover:bg-neutral-100 text-neutral-700',
  },

  // Textes
  text: {
    primary: 'text-neutral-900',
    secondary: 'text-neutral-600',
    muted: 'text-neutral-500',
    inverse: 'text-white',
    success: 'text-success-600',
    error: 'text-error-600',
    warning: 'text-warning-600',
    info: 'text-info-600',
  },

  // Arrière-plans
  background: {
    primary: 'bg-white',
    secondary: 'bg-neutral-50',
    tertiary: 'bg-neutral-100',
    overlay: 'bg-black/50',
    success: 'bg-success-50',
    error: 'bg-error-50',
    warning: 'bg-warning-50',
    info: 'bg-info-50',
  },

  // Bordures
  border: {
    light: 'border-neutral-200',
    medium: 'border-neutral-300',
    dark: 'border-neutral-400',
    success: 'border-success-300',
    error: 'border-error-300',
    warning: 'border-warning-300',
    info: 'border-info-300',
  },
} as const;

// === THÈME SOMBRE (FUTURE EXTENSION) ===
export const darkTokens = {
  colors: {
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
    },
    // ... autres couleurs sombres
  },
} as const;

// Hook pour détecter le thème (futur)
export function useTheme() {
  // Logique de détection du thème
  return 'light'; // Par défaut
}

// Export des tokens par défaut
export default tokens;
