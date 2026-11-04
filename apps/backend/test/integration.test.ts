import { test } from 'node:test';
import * as assert from 'node:assert';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '../src/database/schema';
import { AuthService } from '../src/modules/auth/auth.service';
import { GroupsService } from '../src/modules/groups/groups.service';
import { ExpensesService } from '../src/modules/expenses/expenses.service';
import { SettlementsService } from '../src/modules/settlements/settlements.service';
import { BalancesService } from '../src/modules/balances/balances.service';
import { JwtService } from '@nestjs/jwt';

class MockEventsGateway {
  emitToUser() {}
  emitToGroup() {}
  broadcast() {}
}

test('Integration Test - End-to-End Workflow with PostgreSQL Engine', async (t) => {
  // 1. Initialize in-memory PGlite instance for testing
  const pglite = new PGlite();
  await pglite.waitReady;

  await pglite.exec(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name VARCHAR(150) NOT NULL,
      profile_image TEXT,
      default_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
      theme_preference VARCHAR(10) NOT NULL DEFAULT 'system',
      is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      verification_otp VARCHAR(6),
      reset_password_otp VARCHAR(6),
      reset_password_expires_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE user_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      refresh_token_hash TEXT NOT NULL,
      user_agent TEXT,
      ip_address VARCHAR(50),
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE friend_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(sender_id, receiver_id)
    );

    CREATE TABLE friendships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(user1_id, user2_id)
    );

    CREATE TABLE groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(150) NOT NULL,
      description TEXT,
      image_url TEXT,
      category VARCHAR(50) NOT NULL DEFAULT 'friends',
      default_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      created_by_id UUID NOT NULL REFERENCES users(id),
      invite_code VARCHAR(32) NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE group_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL DEFAULT 'member',
      joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(group_id, user_id)
    );

    CREATE TABLE expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(200) NOT NULL,
      total_amount_minor INT NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      category VARCHAR(50) NOT NULL DEFAULT 'general',
      date TIMESTAMP NOT NULL,
      payer_id UUID NOT NULL REFERENCES users(id),
      group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
      split_type VARCHAR(30) NOT NULL DEFAULT 'equal',
      notes TEXT,
      receipt_url TEXT,
      created_by_id UUID NOT NULL REFERENCES users(id),
      is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE expense_participants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id),
      allocated_amount_minor INT NOT NULL,
      split_type VARCHAR(30) NOT NULL,
      split_value NUMERIC(10, 2),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE settlements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      payer_id UUID NOT NULL REFERENCES users(id),
      receiver_id UUID NOT NULL REFERENCES users(id),
      group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
      amount_minor INT NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      payment_method VARCHAR(30) NOT NULL DEFAULT 'cash',
      notes TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
      confirmed_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(50) NOT NULL,
      actor_id UUID NOT NULL REFERENCES users(id),
      group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  const db = drizzle(pglite, { schema });
  const jwtService = new JwtService({ secret: 'test-secret' });
  const mockGateway = new MockEventsGateway() as any;

  const authService = new AuthService(db, jwtService);
  const groupsService = new GroupsService(db, mockGateway);
  const expensesService = new ExpensesService(db, mockGateway);
  const settlementsService = new SettlementsService(db, mockGateway);
  const balancesService = new BalancesService(db);

  // Step 1: User Signup
  const userA = await authService.signup({
    email: 'alice@matrixsplit.com',
    password: 'Password123!',
    fullName: 'Alice Johnson',
    defaultCurrency: 'INR',
  });
  assert.ok(userA.accessToken);
  assert.equal(userA.user.fullName, 'Alice Johnson');

  const userB = await authService.signup({
    email: 'bob@matrixsplit.com',
    password: 'Password123!',
    fullName: 'Bob Smith',
    defaultCurrency: 'INR',
  });

  const userC = await authService.signup({
    email: 'charlie@matrixsplit.com',
    password: 'Password123!',
    fullName: 'Charlie Davis',
    defaultCurrency: 'INR',
  });

  // Step 2: Create Group
  const group = await groupsService.createGroup(userA.user.id, {
    name: 'Goa Weekend Trip',
    category: 'trip',
    defaultCurrency: 'INR',
    memberUserIds: [userB.user.id, userC.user.id],
  });
  assert.equal(group.name, 'Goa Weekend Trip');

  const members = await groupsService.getGroupMembers(group.id);
  assert.equal(members.length, 3);

  // Step 3: Add Shared Expense (Equal Split of ₹3000 -> 300,000 minor units)
  // Alice pays 300,000. Participants: Alice, Bob, Charlie (100,000 each)
  const expense = await expensesService.createExpense(userA.user.id, {
    title: 'Beach Villa Stay',
    totalAmountMinor: 300000,
    currency: 'INR',
    category: 'housing',
    date: '2026-11-04T12:00:00Z',
    payerId: userA.user.id,
    groupId: group.id,
    splitType: 'equal',
    participants: [
      { userId: userA.user.id },
      { userId: userB.user.id },
      { userId: userC.user.id },
    ],
  });
  assert.equal(expense.totalAmountMinor, 300000);
  assert.equal(expense.participants.length, 3);

  // Step 4: Verify Group Balances & Simplified Debts
  const groupBalances = await balancesService.getGroupBalances(group.id, userA.user.id);
  // Alice is owed 200,000 net (paid 300k, share 100k)
  assert.equal(groupBalances.userNetBalanceMinor, 200000);

  // Simplified debts: Bob owes Alice 100k, Charlie owes Alice 100k
  assert.equal(groupBalances.simplifiedDebts.length, 2);

  // Step 5: Record Settlement (Bob pays Alice ₹1000 = 100,000 minor units)
  const settlement = await settlementsService.createSettlement(userB.user.id, {
    payerId: userB.user.id,
    receiverId: userA.user.id,
    groupId: group.id,
    amountMinor: 100000,
    currency: 'INR',
    paymentMethod: 'upi',
    notes: 'Villa share settled via UPI',
  });
  assert.equal(settlement.status, 'pending');

  // Alice confirms receipt of settlement
  const confirmed = await settlementsService.confirmSettlement(settlement.id, userA.user.id, {
    status: 'confirmed',
  });
  assert.equal(confirmed.status, 'confirmed');

  // Step 6: Verify Balances after Settlement
  const updatedGroupBalances = await balancesService.getGroupBalances(group.id, userA.user.id);
  // Bob is now 0 net balance! Only Charlie owes Alice 100,000.
  assert.equal(updatedGroupBalances.userNetBalanceMinor, 100000);
  assert.equal(updatedGroupBalances.simplifiedDebts.length, 1);
  assert.equal(updatedGroupBalances.simplifiedDebts[0].fromUserId, userC.user.id);
  assert.equal(updatedGroupBalances.simplifiedDebts[0].toUserId, userA.user.id);

  console.log('✅ End-to-end financial transaction integration test completed successfully!');
});
