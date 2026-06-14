#!/usr/bin/env node

/**
 * Seed Script: Push sample coupons to the backend
 * 
 * Usage:
 *   node seed-coupons.mjs
 *   node seed-coupons.mjs --api-url https://laundry-service-booking-app-backend.onrender.com/api/v1
 *   node seed-coupons.mjs --api-url http://192.168.10.58:3000/api/v1
 * 
 * Prerequisites:
 *   - Backend server must be running
 *   - Admin auth token from localStorage (or pass --token)
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse CLI args
const args = process.argv.slice(2);
let apiUrl = 'https://laundry-service-booking-app-backend.onrender.com/api/v1';
let token = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--api-url' && args[i + 1]) apiUrl = args[++i];
  if (args[i] === '--token' && args[i + 1]) token = args[++i];
}

// Read sample coupons
const coupons = JSON.parse(readFileSync(resolve(__dirname, 'sample-coupons.json'), 'utf-8'));

console.log(`\n🚀 Seeding ${coupons.length} coupons to: ${apiUrl}/admin/coupons\n`);

let success = 0;
let failed = 0;
let skipped = 0;

for (const coupon of coupons) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${apiUrl}/admin/coupons`, {
      method: 'POST',
      headers,
      body: JSON.stringify(coupon),
    });

    const data = await res.json();

    if (res.ok && (data.status === 'success' || data.success)) {
      console.log(`  ✅ ${coupon.code} — ${coupon.title}`);
      success++;
    } else if (res.status === 409 || data?.message?.toLowerCase().includes('already exists') || data?.message?.toLowerCase().includes('duplicate')) {
      console.log(`  ⏭️  ${coupon.code} — Already exists, skipping`);
      skipped++;
    } else {
      console.log(`  ❌ ${coupon.code} — ${data.message || res.statusText}`);
      failed++;
    }
  } catch (err) {
    console.log(`  ❌ ${coupon.code} — Network error: ${err.message}`);
    failed++;
  }
}

console.log(`\n📊 Results: ${success} created, ${skipped} skipped, ${failed} failed`);
console.log(`✅ Done!\n`);
