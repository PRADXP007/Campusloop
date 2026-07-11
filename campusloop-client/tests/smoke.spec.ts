import { test, expect } from '@playwright/test';

test.describe('CampusLoop E2E Smoke Tests', () => {
  test('should load the landing page successfully', async ({ page }) => {
    // Navigate to the base URL
    await page.goto('/');

    // Verify that the title "CampusLoop" is visible
    const brandTitle = page.locator('header').getByText('CampusLoop').first();
    await expect(brandTitle).toBeVisible();

    // Verify the "Sign In" link is visible
    const signInButton = page.locator('a:has-text("Sign In")');
    await expect(signInButton).toBeVisible();
  });

  test('should navigate to the login page and show correct elements', async ({ page }) => {
    // Navigate directly to /login
    await page.goto('/login');

    // Verify that the heading is "Welcome Back"
    const heading = page.locator('h2');
    await expect(heading).toContainText('Welcome Back');

    // Verify fields are present
    const emailInput = page.locator('#login-email');
    const passwordInput = page.locator('#login-password');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should show validation error on invalid login inputs', async ({ page }) => {
    await page.goto('/login');

    // Enter an invalid email
    await page.fill('#login-email', 'invalid-email');
    await page.fill('#login-password', 'short');

    // Click submit button
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Verify that the error message is displayed
    const emailError = page.locator('text=Please enter a valid email address');
    await expect(emailError).toBeVisible();
  });
});
