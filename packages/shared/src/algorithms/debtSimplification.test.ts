import test from 'node:test';
import assert from 'node:assert/strict';
import { simplifyDebts, calculateNetPositionsFromLedger } from './debtSimplification';

test('Debt Simplification - Direct 3-party chain (A -> B -> C simplifies to A -> C)', () => {
  // A owes 500 (-500)
  // B is owed 500 from A and owes 500 to C (net 0)
  // C is owed 500 (+500)
  const netPositions = [
    { userId: 'UserA', netAmountMinor: -50000 },
    { userId: 'UserB', netAmountMinor: 0 },
    { userId: 'UserC', netAmountMinor: 50000 },
  ];

  const simplified = simplifyDebts(netPositions, 'INR');

  assert.equal(simplified.length, 1);
  assert.equal(simplified[0].fromUserId, 'UserA');
  assert.equal(simplified[0].toUserId, 'UserC');
  assert.equal(simplified[0].amountMinor, 50000);
});

test('Debt Simplification - 4 members complex trip expenses', () => {
  // Alice paid 400 for dinner for Alice, Bob, Charlie, David (100 each)
  // Bob paid 200 for taxi for Bob & Charlie (100 each)
  // Ledger calculation:
  // Alice: +400 - 100 = +300
  // Bob: +200 - 100 - 100 = 0
  // Charlie: -100 - 100 = -200
  // David: -100 = -100
  const userIds = ['Alice', 'Bob', 'Charlie', 'David'];
  const expenses = [
    {
      payerId: 'Alice',
      participants: [
        { userId: 'Alice', allocatedAmountMinor: 100 },
        { userId: 'Bob', allocatedAmountMinor: 100 },
        { userId: 'Charlie', allocatedAmountMinor: 100 },
        { userId: 'David', allocatedAmountMinor: 100 },
      ],
    },
    {
      payerId: 'Bob',
      participants: [
        { userId: 'Bob', allocatedAmountMinor: 100 },
        { userId: 'Charlie', allocatedAmountMinor: 100 },
      ],
    },
  ];

  const netPositions = calculateNetPositionsFromLedger(userIds, expenses, []);
  const simplified = simplifyDebts(netPositions, 'INR');

  // Should require only 2 transactions: Charlie -> Alice (200), David -> Alice (100)
  assert.equal(simplified.length, 2);
  const totalPaidToAlice = simplified
    .filter((t) => t.toUserId === 'Alice')
    .reduce((s, t) => s + t.amountMinor, 0);
  assert.equal(totalPaidToAlice, 300);
});
