# Matrice de Tests - NourX Application

## Vue d'ensemble
Cette matrice couvre les tests unitaires, d'intégration et E2E pour l'application NourX.

## 1. Tests Unitaires (Vitest + RTL)

### Composants UI Critiques

#### DataTable Component
```typescript
// src/components/shared/DataTable.test.tsx
describe('DataTable', () => {
  it('renders table with data', () => {})
  it('handles sorting correctly', () => {})
  it('supports pagination', () => {})
  it('shows loading state', () => {})
  it('displays empty state', () => {})
  it('handles row selection', () => {})
  it('exports data correctly', () => {})
})
```

#### Dialogs Components
```typescript
// src/components/ui/dialog.test.tsx
describe('Dialog Components', () => {
  it('opens and closes correctly', () => {})
  it('handles form submission', () => {})
  it('validates form inputs', () => {})
  it('shows loading states', () => {})
  it('handles escape key', () => {})
  it('traps focus correctly', () => {})
})
```

#### PageHeader Component
```typescript
// src/components/shared/PageHeader.test.tsx
describe('PageHeader', () => {
  it('renders title and description', () => {})
  it('shows breadcrumbs correctly', () => {})
  it('displays action buttons', () => {})
  it('handles back navigation', () => {})
})
```

### Utilitaires et Helpers

#### Auth Helpers
```typescript
// src/lib/auth.test.ts
describe('Auth Helpers', () => {
  it('validates admin role correctly', () => {})
  it('validates client role correctly', () => {})
  it('checks access permissions', () => {})
  it('handles session validation', () => {})
})
```

#### API Client
```typescript
// src/lib/api-client.test.ts
describe('API Client', () => {
  it('handles successful requests', () => {})
  it('handles error responses', () => {})
  it('includes authentication headers', () => {})
  it('supports cache tags', () => {})
  it('handles network errors', () => {})
})
```

## 2. Tests d'Intégration (Vitest + MSW)

### Formulaires RHF (React Hook Form)

#### Formulaire de Connexion
```typescript
// src/app/auth/login/__tests__/integration.test.tsx
describe('Login Form Integration', () => {
  it('submits valid credentials successfully', () => {})
  it('shows validation errors for invalid email', () => {})
  it('shows validation errors for empty password', () => {})
  it('handles server errors gracefully', () => {})
  it('redirects after successful login', () => {})
  it('shows loading state during submission', () => {})
})
```

#### Formulaire d'Inscription
```typescript
// src/app/auth/register/__tests__/integration.test.tsx
describe('Registration Form Integration', () => {
  it('creates account with valid data', () => {})
  it('validates password strength', () => {})
  it('checks email uniqueness', () => {})
  it('handles organization selection', () => {})
  it('sends activation email', () => {})
})
```

#### Formulaire de Création de Ticket
```typescript
// src/app/client/support/new/__tests__/integration.test.tsx
describe('Create Ticket Form Integration', () => {
  it('creates ticket with all fields', () => {})
  it('validates required fields', () => {})
  it('handles file attachments', () => {})
  it('shows success message', () => {})
  it('redirects to ticket detail', () => {})
})
```

### Guides de Navigation et Guards

#### Middleware Auth Guards
```typescript
// src/middleware.test.ts
describe('Auth Middleware', () => {
  it('redirects unauthenticated users', () => {})
  it('allows access to public routes', () => {})
  it('validates admin portal access', () => {})
  it('validates client portal access', () => {})
  it('redirects disabled accounts', () => {})
  it('handles wrong portal redirects', () => {})
})
```

#### Layout Guards
```typescript
// src/app/(admin-portal)/layout.test.tsx
describe('Admin Layout Guards', () => {
  it('validates session on server', () => {})
  it('checks admin permissions', () => {})
  it('handles session expiration', () => {})
  it('redirects unauthorized users', () => {})
})
```

## 3. Tests E2E (Playwright)

### Parcours Essentiels

#### 1. Connexion Admin
```typescript
// e2e/admin-login.spec.ts
test('Admin login flow', async ({ page }) => {
  // Navigation vers login admin
  await page.goto('/auth/admin-login');

  // Saisie des identifiants
  await page.fill('[data-testid="email-input"]', 'admin@nourx.com');
  await page.fill('[data-testid="password-input"]', 'password');

  // Soumission du formulaire
  await page.click('[data-testid="login-button"]');

  // Vérification redirection dashboard admin
  await expect(page).toHaveURL('/admin/dashboard');

  // Vérification contenu dashboard
  await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
});
```

#### 2. Visite Dashboard Client
```typescript
// e2e/client-dashboard.spec.ts
test('Client dashboard access', async ({ page }) => {
  // Connexion préalable
  await loginAsClient(page);

  // Navigation dashboard client
  await page.goto('/client/dashboard');

  // Vérification KPIs
  await expect(page.locator('[data-testid="active-projects-count"]')).toBeVisible();
  await expect(page.locator('[data-testid="open-tickets-count"]')).toBeVisible();

  // Vérification projets récents
  await expect(page.locator('[data-testid="recent-projects"]')).toBeVisible();

  // Test interaction avec projet
  await page.click('[data-testid="project-link"]:first-child');
  await expect(page).toHaveURL(/\/client\/projects\/\d+/);
});
```

#### 3. Création de Ticket
```typescript
// e2e/create-ticket.spec.ts
test('Create support ticket', async ({ page }) => {
  // Connexion client
  await loginAsClient(page);

  // Navigation formulaire ticket
  await page.goto('/client/support/new');

  // Remplissage formulaire
  await page.fill('[data-testid="title-input"]', 'Problème technique');
  await page.selectOption('[data-testid="priority-select"]', 'high');
  await page.fill('[data-testid="description-input"]', 'Description détaillée...');

  // Soumission
  await page.click('[data-testid="submit-button"]');

  // Vérification succès et redirection
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  await expect(page).toHaveURL(/\/client\/support\/\d+/);
});
```

#### 4. Approbation de Livrable
```typescript
// e2e/approve-deliverable.spec.ts
test('Approve project deliverable', async ({ page }) => {
  // Connexion client
  await loginAsClient(page);

  // Navigation projet avec livrable
  await page.goto('/client/projects/123');

  // Accès livrable
  await page.click('[data-testid="deliverable-link"]');

  // Approbation livrable
  await page.click('[data-testid="approve-button"]');

  // Confirmation dans dialog
  await page.click('[data-testid="confirm-approve"]');

  // Vérification statut mis à jour
  await expect(page.locator('[data-testid="deliverable-status"]')).toContainText('Approuvé');
});
```

#### 5. Téléchargement de Facture
```typescript
// e2e/download-invoice.spec.ts
test('Download invoice', async ({ page }) => {
  // Connexion client
  await loginAsClient(page);

  // Navigation facturation
  await page.goto('/client/billing');

  // Sélection facture
  await page.click('[data-testid="invoice-row"]:first-child');

  // Téléchargement
  const downloadPromise = page.waitForEvent('download');
  await page.click('[data-testid="download-button"]');
  const download = await downloadPromise;

  // Vérification téléchargement
  expect(download.suggestedFilename()).toMatch(/facture.*\.pdf$/);
});
```

### Tests de Sécurité

#### Tentatives d'Accès Non Autorisé
```typescript
// e2e/security-access.spec.ts
test('Prevent unauthorized access', async ({ page }) => {
  // Tentative accès admin sans auth
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL('/auth/admin-login');

  // Tentative accès client avec compte admin
  await loginAsAdmin(page);
  await page.goto('/client/dashboard');
  await expect(page).toHaveURL(/\/auth\/wrong-portal/);
});
```

## 4. Tests de Performance

### Métriques à Surveiller
- **Time to First Byte (TTFB)**: < 500ms
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Tests Automatisés
```typescript
// e2e/performance.spec.ts
test('Dashboard performance', async ({ page }) => {
  await loginAsClient(page);
  await page.goto('/client/dashboard');

  // Mesure temps de chargement
  const loadTime = await page.evaluate(() => {
    return performance.now();
  });

  expect(loadTime).toBeLessThan(2000);
});
```

## 5. Configuration et Outils

### Vitest Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

### Playwright Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

## 6. Métriques de Couverture

### Objectifs de Couverture
- **Tests Unitaires**: 80% minimum
- **Tests d'Intégration**: 70% minimum
- **Tests E2E**: Couverture fonctionnelle complète des parcours critiques

### Rapports de Couverture
```bash
# Générer rapport couverture
npm run test:coverage

# Générer rapport HTML
npm run test:coverage:html
```

## 7. Stratégie d'Exécution

### Pipeline CI/CD
1. **Pre-commit**: Linting + tests unitaires
2. **Push**: Tests complets (unitaires + intégration)
3. **PR**: Tests E2E sur staging
4. **Release**: Tests complets sur production

### Environnements de Test
- **Local**: Développement actif
- **Staging**: Tests E2E automatisés
- **Production**: Tests de fumée post-déploiement

Cette matrice assure une couverture complète des fonctionnalités critiques et des scénarios d'erreur de l'application NourX.
