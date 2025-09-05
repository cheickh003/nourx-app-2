import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    // Règles strictes pour React
    "@eslint-react/recommended",
    "@eslint-react/hooks",
    // Accessibilité
    "plugin:jsx-a11y/recommended",
    // Bonnes pratiques
    "plugin:react-perf/recommended",
  ),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "**/*.config.js",
      "**/*.config.mjs",
    ],
  },
  {
    rules: {
      // === IMPORTS ===
      // Trier les imports automatiquement
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      // === REACT ===
      // Exhaustive deps pour useEffect et autres hooks
      "react-hooks/exhaustive-deps": "error",

      // Préférer les composants fonctionnels
      "react/prefer-stateless-function": "warn",

      // Props non utilisés
      "react/prop-types": "off", // TypeScript s'en charge

      // === ACCESSIBILITÉ ===
      // Labels requis pour les inputs
      "jsx-a11y/label-has-associated-control": "error",

      // Images doivent avoir alt
      "jsx-a11y/alt-text": "error",

      // Boutons doivent avoir du contenu ou aria-label
      "jsx-a11y/control-has-associated-label": [
        "error",
        {
          ignoreElements: ["button"],
        },
      ],

      // === TYPESCRIPT ===
      // Pas de any explicite
      "@typescript-eslint/no-explicit-any": "warn",

      // Préférer const assertions
      "@typescript-eslint/prefer-const": "error",

      // === PERFORMANCES ===
      // Pas de console.log en production
      "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",

      // === BONNES PRATIQUES ===
      // Pas de code unreachable
      "no-unreachable": "error",

      // Préférer === à ==
      "eqeqeq": ["error", "always"],

      // Pas de variables non utilisées
      "no-unused-vars": "off", // Désactivé car TypeScript s'en charge
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // === NEXT.JS ===
      // Pas d'img sans optimisation
      "@next/next/no-img-element": "error",

      // === REACT PERF ===
      // Pas de rendu inutile
      "react-perf/jsx-no-jsx-as-prop": "error",

      // === SÉCURITÉ ===
      // Pas de dangerouslySetInnerHTML sans justification
      "react/no-danger": "warn",
    },
  },
  {
    // Configuration spécifique pour les fichiers TypeScript
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Imports absolus privilégiés
      "import/no-relative-packages": "error",

      // Interfaces vs types
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    },
  },
  {
    // Configuration pour les tests
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      // Tests peuvent utiliser console
      "no-console": "off",

      // Tests peuvent utiliser any
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
