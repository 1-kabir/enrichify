# Testing Guide

This guide covers testing practices and procedures for Enrichify.

## Table of Contents

- [Overview](#overview)
- [End-to-End Testing](#end-to-end-testing)
- [Running Tests](#running-tests)
- [Visual Testing](#visual-testing)
- [Mobile Responsiveness Testing](#mobile-responsiveness-testing)
- [Writing Tests](#writing-tests)

## Overview

Enrichify uses Playwright for end-to-end (E2E) testing. Playwright provides reliable, fast testing across multiple browsers with excellent developer experience.

### Test Structure

```
frontend/
├── playwright.config.ts    # Playwright configuration
├── tests/                  # Test files
│   ├── login.spec.ts      # Login page tests
│   ├── dashboard.spec.ts  # Dashboard tests
│   └── screenshots/       # Visual regression screenshots
└── package.json           # Test scripts
```

## End-to-End Testing

### Prerequisites

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Install Playwright Browsers**:
   ```bash
   npx playwright install
   ```

3. **Start the Application**:
   The application must be running before tests can execute. Use Docker Compose:
   ```bash
   cd ..
   docker compose up -d
   ```
   
   Wait for services to be ready:
   ```bash
   docker compose ps
   ```

## Running Tests

### Basic Test Execution

Run all tests:
```bash
cd frontend
npm run test:e2e
```

Run tests in headed mode (see browser):
```bash
npm run test:e2e:headed
```

Run tests with UI mode (interactive):
```bash
npm run test:e2e:ui
```

### Run Specific Tests

Run a specific test file:
```bash
npx playwright test login.spec.ts
```

Run tests matching a pattern:
```bash
npx playwright test --grep "login"
```

### Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## Visual Testing

### Screenshots

Playwright automatically captures screenshots on test failures. Manual screenshots can be taken:

```typescript
await page.screenshot({ 
  path: 'tests/screenshots/login-page.png',
  fullPage: true 
});
```

### Visual Regression Testing

Compare screenshots between test runs:

1. **Create baseline**:
   ```bash
   npm run test:e2e
   ```
   Review screenshots in `tests/screenshots/`

2. **Future runs**: Playwright will compare against baseline

3. **Update baselines** when UI changes are intentional:
   ```bash
   npm run test:e2e -- --update-snapshots
   ```

## Mobile Responsiveness Testing

### Testing Different Viewports

Tests include mobile viewport testing:

```typescript
test('should be mobile responsive', async ({ page }) => {
  // iPhone SE
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/dashboard');
  
  // iPad
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/dashboard');
});
```

### Common Viewports

- **Mobile**: 375x667 (iPhone SE), 390x844 (iPhone 14)
- **Tablet**: 768x1024 (iPad), 1024x768 (iPad Landscape)
- **Desktop**: 1920x1080, 1366x768

### Device Emulation

Use Playwright's device descriptors:

```typescript
import { devices } from '@playwright/test';

test.use(devices['iPhone 14']);
test('mobile test', async ({ page }) => {
  // Test runs with iPhone 14 specs
});
```

## Writing Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/path');
    
    // Act
    await page.getByRole('button', { name: 'Click me' }).click();
    
    // Assert
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

### Best Practices

#### 1. Use Semantic Locators

✅ Good:
```typescript
await page.getByRole('button', { name: 'Sign in' });
await page.getByLabel('Email address');
await page.getByText('Welcome back');
```

❌ Avoid:
```typescript
await page.locator('.btn-primary'); // Brittle CSS selectors
await page.locator('#email-input');
```

#### 2. Wait for Elements

Always wait for elements before interacting:

```typescript
await expect(page.getByText('Loading')).toBeVisible();
await expect(page.getByText('Loading')).not.toBeVisible();
await expect(page.getByText('Data loaded')).toBeVisible();
```

#### 3. Handle Async Operations

```typescript
// Wait for navigation
await Promise.all([
  page.waitForNavigation(),
  page.click('a[href="/dashboard"]')
]);

// Wait for API response
await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/api/users')),
  page.click('button[type="submit"]')
]);
```

#### 4. Test User Flows

Test complete user journeys:

```typescript
test('user can complete full enrichment flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@test.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Navigate to websets
  await expect(page).toHaveURL('/dashboard');
  await page.click('a[href="/websets"]');
  
  // Create webset
  await page.click('button:has-text("New Webset")');
  await page.fill('[name="name"]', 'Test Webset');
  await page.click('button:has-text("Create")');
  
  // Verify creation
  await expect(page.getByText('Test Webset')).toBeVisible();
});
```

#### 5. Isolate Tests

Each test should be independent:

```typescript
test.beforeEach(async ({ page }) => {
  // Setup: login, clear data, etc.
  await page.goto('/login');
  // ... login logic
});

test.afterEach(async ({ page }) => {
  // Cleanup if needed
});
```

### Example Tests

#### Login Test

```typescript
test('successful login redirects to dashboard', async ({ page }) => {
  await page.goto('/login');
  
  await page.getByLabel('Email address').fill('admin@test.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Dashboard')).toBeVisible();
});
```

#### Form Validation Test

```typescript
test('form shows validation errors', async ({ page }) => {
  await page.goto('/websets/new');
  
  // Submit empty form
  await page.getByRole('button', { name: 'Create' }).click();
  
  // Check for validation messages
  await expect(page.getByText('Name is required')).toBeVisible();
});
```

#### API Integration Test

```typescript
test('data loads from API', async ({ page }) => {
  await page.goto('/websets');
  
  // Wait for loading to complete
  await page.waitForSelector('[data-testid="webset-list"]');
  
  // Verify data rendered
  await expect(page.getByRole('row')).toHaveCount(5);
});
```

## Debugging Tests

### Debug Mode

Run tests in debug mode with Playwright Inspector:

```bash
npx playwright test --debug
```

### Console Logs

Capture console logs during tests:

```typescript
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
```

### Pause Execution

```typescript
await page.pause(); // Opens Playwright Inspector
```

### Slow Motion

```typescript
// In playwright.config.ts
use: {
  launchOptions: {
    slowMo: 1000 // Slow down by 1 second
  }
}
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Start services
        run: docker compose up -d
      
      - name: Wait for services
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:8080; do sleep 2; done'
      
      - name: Run tests
        run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## Performance Testing

### Measure Page Load Times

```typescript
test('page loads within acceptable time', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/dashboard');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(3000); // 3 seconds
});
```

### Lighthouse Integration

For advanced performance testing, integrate Lighthouse:

```bash
npm install -D @playwright/test lighthouse
```

## Accessibility Testing

### Check for A11y Issues

```typescript
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/dashboard');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## Troubleshooting

### Common Issues

#### Tests Timeout

```typescript
// Increase timeout for slow operations
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  await page.goto('/slow-page');
});
```

#### Flaky Tests

```typescript
// Add explicit waits
await expect(page.getByText('Content')).toBeVisible({ timeout: 10000 });

// Use soft assertions for less critical checks
await expect.soft(page.getByText('Optional')).toBeVisible();
```

#### Element Not Found

```typescript
// Wait for element to be attached to DOM
await page.waitForSelector('button', { state: 'attached' });

// Check if element exists before interacting
const button = await page.$('button');
if (button) {
  await button.click();
}
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Test Selectors](https://playwright.dev/docs/selectors)
- [Assertions](https://playwright.dev/docs/test-assertions)
