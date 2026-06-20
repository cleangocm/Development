import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(path: string) {
  return readFileSync(resolve(root, path), 'utf8');
}

function expectFile(path: string) {
  expect(existsSync(resolve(root, path)), `${path} should exist`).toBe(true);
}

describe('CleanGo Day 12 launch readiness', () => {
  it('keeps customer launch navigation on CleanGo Firestore-first paths', () => {
    const home = read('frontend/Laundry-Service-Booking-App-Frontend/src/app/page.tsx');
    const header = read('frontend/Laundry-Service-Booking-App-Frontend/src/components/layout/Header.tsx');

    expect(home).toContain('<Hero />');
    expect(home).toContain('<Services />');
    expect(header).toContain("href: '/subscription-plans'");
    expect(header).toContain("src=\"/Images/logo/header.png\"");
    expect(header).not.toContain('headerLogo ||');
    expect(header).not.toMatch(/Ultra\s*Wash/i);
  });

  it('uses generated plan artwork instead of repeating the CleanGo logo in plan cards', () => {
    const services = read('frontend/Laundry-Service-Booking-App-Frontend/src/components/sections/Services.tsx');

    [
      'basic-plan.png',
      'standard-plan.png',
      'premium-plan.png',
      'business-plan.png',
    ].forEach((file) => {
      expect(services).toContain(`/Images/brand/plans/${file}`);
      expectFile(`frontend/Laundry-Service-Booking-App-Frontend/public/Images/brand/plans/${file}`);
    });

    expect(services).toContain('formatXaf');
    expect(services).not.toContain('cleango-app-icon-blue.png');
  });

  it('keeps customer, admin, and collector entry points branded for launch', () => {
    const customerLogin = read('frontend/Laundry-Service-Booking-App-Frontend/src/app/login/page.tsx');
    const adminLogin = read('frontend/Laundry-Service-Booking-App-Frontend/src/app/admin/login/page.tsx');
    const deliveryLogin = read('frontend/Laundry-Service-Booking-App-Frontend/src/app/delivery/login/page.tsx');

    expect(customerLogin).toContain('Bienvenue !');
    expect(customerLogin).toContain('customer.test@cleango.local');
    expect(adminLogin).toContain('CleanGo CM');
    expect(adminLogin).toContain('admin.test@cleango.local');
    expect(deliveryLogin).toContain('CleanGo CM');
    expect(deliveryLogin).toContain('collector.test@cleango.local');
    expect(`${customerLogin}\n${adminLogin}\n${deliveryLogin}`).not.toMatch(/Ultra\s*Wash/i);
  });

  it('keeps production Firebase rules and indexes ready for launch-critical queries', () => {
    const firestoreRules = read('firestore.rules');
    const storageRules = read('storage.rules');
    const indexes = read('firestore.indexes.json');

    expect(firestoreRules).toContain('match /pickups/{pickupId}');
    expect(firestoreRules).toContain('assignedExistingCollectorRecord');
    expect(firestoreRules).toContain("request.resource.data.status == 'scheduled'");
    expect(firestoreRules).toContain("request.resource.data.status in ['en_route', 'arrived', 'completed', 'missed', 'rescheduled']");
    expect(storageRules).toContain('match /pickupProof/{customerId}/{collectorId}/{pickupId}/{fileName}');
    expect(indexes).toContain('"collectionGroup": "pickups"');
    expect(indexes).toContain('"fieldPath": "collectorId"');
    expect(indexes).toContain('"fieldPath": "scheduledDate"');
    expect(indexes).toContain('"collectionGroup": "notifications"');
  });
});
