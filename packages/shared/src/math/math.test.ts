import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toMinorUnits,
  fromMinorUnits,
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateShareBasedSplit,
} from './index';

test('Financial Calculations - Minor Unit Conversions', () => {
  assert.equal(toMinorUnits(10.5, 'INR'), 1050);
  assert.equal(toMinorUnits('1,234.56', 'USD'), 123456);
  assert.equal(toMinorUnits(500, 'JPY'), 500); // 0 decimals
  assert.equal(fromMinorUnits(1050, 'INR'), 10.5);
  assert.equal(fromMinorUnits(123456, 'USD'), 1234.56);
});

test('Split Algorithm - Equal Split with Remainder', () => {
  // 100 split 3 ways -> 34, 33, 33 = 100
  const result = calculateEqualSplit(100, ['u1', 'u2', 'u3']);
  assert.equal(result.length, 3);
  assert.equal(result[0].allocatedAmountMinor, 34);
  assert.equal(result[1].allocatedAmountMinor, 33);
  assert.equal(result[2].allocatedAmountMinor, 33);

  const total = result.reduce((s, p) => s + p.allocatedAmountMinor, 0);
  assert.equal(total, 100);
});

test('Split Algorithm - Exact Split validation', () => {
  const result = calculateExactSplit(1500, [
    { userId: 'u1', allocatedAmountMinor: 500 },
    { userId: 'u2', allocatedAmountMinor: 1000 },
  ]);
  assert.equal(result.length, 2);

  assert.throws(() => {
    calculateExactSplit(1500, [
      { userId: 'u1', allocatedAmountMinor: 500 },
      { userId: 'u2', allocatedAmountMinor: 999 },
    ]);
  }, /difference: 1/);
});

test('Split Algorithm - Percentage Split with precise rounding', () => {
  // Split 1000 across 33.33%, 33.33%, 33.34%
  const result = calculatePercentageSplit(1000, [
    { userId: 'u1', percentage: 33.33 },
    { userId: 'u2', percentage: 33.33 },
    { userId: 'u3', percentage: 33.34 },
  ]);

  const total = result.reduce((s, p) => s + p.allocatedAmountMinor, 0);
  assert.equal(total, 1000);
});

test('Split Algorithm - Share-based Split', () => {
  // Total 1000 with shares 2 : 1 : 1 -> total shares = 4 -> 500, 250, 250
  const result = calculateShareBasedSplit(1000, [
    { userId: 'u1', shares: 2 },
    { userId: 'u2', shares: 1 },
    { userId: 'u3', shares: 1 },
  ]);

  assert.equal(result[0].allocatedAmountMinor, 500);
  assert.equal(result[1].allocatedAmountMinor, 250);
  assert.equal(result[2].allocatedAmountMinor, 250);
  assert.equal(result.reduce((s, p) => s + p.allocatedAmountMinor, 0), 1000);
});
