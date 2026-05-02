/**
 * Testes de Performance usando Lighthouse
 * 
 * Requer: npm install -D @lhci/cli
 * 
 * Execução:
 * npx playwright test lighthouse.spec.js
 * ou
 * lhci autorun
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Lighthouse Performance Tests', () => {
  test('Lighthouse - Landing Page', async ({ page }) => {
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');
    
    // Executar Lighthouse via CLI
    const url = page.url();
    const report = execSync(`lighthouse ${url} --output=json --chrome-flags="--headless" --quiet`, {
      encoding: 'utf-8',
    });
    
    const results = JSON.parse(report);
    const scores = results.categories;
    
    console.log('Lighthouse Scores:');
    console.log(`Performance: ${(scores.performance.score * 100).toFixed(0)}`);
    console.log(`Accessibility: ${(scores.accessibility.score * 100).toFixed(0)}`);
    console.log(`Best Practices: ${(scores['best-practices'].score * 100).toFixed(0)}`);
    console.log(`SEO: ${(scores.seo.score * 100).toFixed(0)}`);
    
    // Assertions
    expect(scores.performance.score).toBeGreaterThan(0.7); // 70+
    expect(scores.accessibility.score).toBeGreaterThan(0.8); // 80+
  });

  test('Lighthouse - Dashboard', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@exemplo.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    const report = execSync(`lighthouse ${url} --output=json --chrome-flags="--headless" --quiet`, {
      encoding: 'utf-8',
    });
    
    const results = JSON.parse(report);
    const scores = results.categories;
    
    console.log('Dashboard Lighthouse Scores:');
    console.log(`Performance: ${(scores.performance.score * 100).toFixed(0)}`);
    
    expect(scores.performance.score).toBeGreaterThan(0.6); // 60+ (dashboard pode ser mais pesado)
  });

  test('Core Web Vitals - Landing Page', async ({ page }) => {
    await page.goto('/landing');
    
    // Medir Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals = {};
          
          entries.forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.lcp = entry.renderTime || entry.loadTime;
            }
            if (entry.entryType === 'first-input') {
              vitals.fid = entry.processingStart - entry.startTime;
            }
          });
          
          // CLS
          let clsValue = 0;
          let clsEntries = [];
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                const firstSessionEntry = clsEntries[0];
                const lastSessionEntry = clsEntries[clsEntries.length - 1];
                
                if (clsValue && entry.startTime - lastSessionEntry.startTime < 1000 &&
                    entry.startTime - firstSessionEntry.startTime < 5000) {
                  clsValue += entry.value;
                  clsEntries.push(entry);
                } else {
                  clsValue = entry.value;
                  clsEntries = [entry];
                }
              }
            }
            vitals.cls = clsValue;
          }).observe({ type: 'layout-shift', buffered: true });
          
          resolve(vitals);
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
        
        // Timeout após 10s
        setTimeout(() => resolve({}), 10000);
      });
    });
    
    console.log('Core Web Vitals:', metrics);
    
    // Assertions baseadas em thresholds recomendados
    if (metrics.lcp) {
      expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s (Good)
    }
    if (metrics.fid) {
      expect(metrics.fid).toBeLessThan(100); // FID < 100ms (Good)
    }
    if (metrics.cls) {
      expect(metrics.cls).toBeLessThan(0.1); // CLS < 0.1 (Good)
    }
  });
});

