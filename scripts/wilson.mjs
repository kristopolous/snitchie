#!/usr/bin/env node
// Wilson score interval for k successes out of n trials at the given z.
// Usage: node scripts/wilson.mjs [k] [n] [z]
// Defaults: k=1, n=8, z=1.96 (95%)
const [k = 1, n = 8, z = 1.96] = process.argv.slice(2).map(Number);
if (Number.isNaN(k) || Number.isNaN(n) || n <= 0 || k < 0 || k > n) {
  console.error("usage: wilson.mjs k n z   (0 <= k <= n, n > 0)");
  process.exit(2);
}
const p = k / n;
const z2 = z * z;
const denom = 1 + z2 / n;
const center = (p + z2 / (2 * n)) / denom;
const margin = (z / denom) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
console.log(`${k}/${n}  z=${z}  ->  ${Math.round((center - margin) * 100)}% - ${Math.round((center + margin) * 100)}%`);

// convenience table for /8
if (process.argv.length === 2) {
  console.log("\n/8 table (95%):");
  for (let i = 0; i <= 8; i++) {
    const p = i / 8, z2 = 1.96 ** 2, d = 1 + z2 / 8;
    const c = (p + z2 / 16) / d;
    const m = (1.96 / d) * Math.sqrt((p * (1 - p)) / 8 + z2 / (4 * 64));
    console.log(`  ${i}/8  ${Math.round((c - m) * 100)}% - ${Math.round((c + m) * 100)}%`);
  }
}
