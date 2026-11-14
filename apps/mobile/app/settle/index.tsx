import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Button,
  Input,
  Avatar,
  Card,
  BalancePill,
} from '@/components';
import { useWatermelonTheme } from '@/theme';
import {
  useFriends,
  useCreateSettlement,
} from '../../src/hooks/useQueries';
import { useAuthStore } from '../../src/stores/authStore';
import {
  toMinorUnits,
  fromMinorUnits,
  formatCurrency,
  SettlementPaymentMethod,
} from '@matrixsplit/shared';

export default function SettleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    groupId?: string;
    targetUserId?: string;
    targetName?: string;
    amountMinor?: string;
  }>();

  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();
  const user = useAuthStore((s) => s.user);
  const { data: friends } = useFriends();
  const createSettlementMutation = useCreateSettlement();

  const initialAmountStr = params.amountMinor
    ? fromMinorUnits(parseInt(params.amountMinor, 10), user?.defaultCurrency || 'INR').toString()
    : '';

  const [selectedFriendId, setSelectedFriendId] = useState<string>(
    params.targetUserId || ''
  );
  const [amountStr, setAmountStr] = useState(initialAmountStr);
  const [paymentMethod, setPaymentMethod] =
    useState<SettlementPaymentMethod>('upi');
  const [notes, setNotes] = useState('');

  const paymentMethods: {
    id: SettlementPaymentMethod;
    label: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { id: 'upi', label: 'UPI / QR', subtitle: 'GPay, PhonePe, Paytm', icon: 'qr-code-outline' },
    { id: 'cash', label: 'Cash', subtitle: 'In-person handoff', icon: 'cash-outline' },
    { id: 'bank_transfer', label: 'Bank Transfer', subtitle: 'NEFT, IMPS, RTGS', icon: 'business-outline' },
    { id: 'other', label: 'Card / Other', subtitle: 'Debit, credit, wallet', icon: 'card-outline' },
  ];

  const handleRecordSettlement = async () => {
    if (!selectedFriendId) {
      Alert.alert('Recipient Required', 'Please select who you are settling with.');
      return;
    }

    const minorUnits = toMinorUnits(amountStr, user?.defaultCurrency || 'INR');
    if (minorUnits <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid settlement amount.');
      return;
    }

    try {
      await createSettlementMutation.mutateAsync({
        payerId: user!.id,
        receiverId: selectedFriendId,
        groupId: params.groupId || null,
        amountMinor: minorUnits,
        currency: user?.defaultCurrency || 'INR',
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        'Settlement Recorded',
        'Payment has been recorded! It updates mutual balances and is marked as verified or pending confirmation.',
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to record settlement');
    }
  };

  const selectedFriend = friends?.find((f: any) => f.id === selectedFriendId);
  const targetFriendName = selectedFriend?.fullName || params.targetName;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Top Navigation Bar */}
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [
            styles.cancelBtn,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="close" size={20} color={theme.text} />
        </Pressable>

        <View style={{ alignItems: 'center' }}>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.text, fontSize: typography.fontSize.base },
            ]}
          >
            Record Settlement
          </Text>
          <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>
            Log direct payment between friends
          </Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Recipient Selector */}
        <View style={{ marginBottom: 20 }}>
          <View style={styles.sectionHeaderRow}>
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.textMuted, fontSize: typography.fontSize.xs },
              ]}
            >
              SETTLING WITH
            </Text>
            {targetFriendName && (
              <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '600' }}>
                Selected: {targetFriendName}
              </Text>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 4, gap: 10 }}
          >
            {/* If param target is present but friend not in list */}
            {params.targetUserId && !friends?.some((f: any) => f.id === params.targetUserId) && (
              <Pressable
                onPress={() => setSelectedFriendId(params.targetUserId!)}
                style={({ pressed }) => [
                  styles.friendChip,
                  {
                    backgroundColor: selectedFriendId === params.targetUserId
                      ? (isDark ? 'rgba(16,185,129,0.18)' : '#ECFDF5')
                      : theme.card,
                    borderColor: selectedFriendId === params.targetUserId ? theme.primary : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Avatar name={params.targetName || 'Friend'} size="sm" />
                <View style={{ marginLeft: 8 }}>
                  <Text
                    style={{
                      color: selectedFriendId === params.targetUserId ? theme.primary : theme.text,
                      fontWeight: selectedFriendId === params.targetUserId ? '700' : '600',
                      fontSize: 13,
                    }}
                  >
                    {params.targetName || 'Friend'}
                  </Text>
                </View>
                {selectedFriendId === params.targetUserId && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={theme.primary}
                    style={{ marginLeft: 6 }}
                  />
                )}
              </Pressable>
            )}

            {friends && friends.length > 0 ? (
              friends.map((f: any) => {
                const isSelected = selectedFriendId === f.id;
                const balanceMinor = f.netBalanceMinor || f.balanceMinor || 0;

                return (
                  <Pressable
                    key={f.id}
                    onPress={() => {
                      setSelectedFriendId(f.id);
                      if (balanceMinor !== 0 && !amountStr) {
                        setAmountStr(
                          fromMinorUnits(Math.abs(balanceMinor), user?.defaultCurrency || 'INR').toString()
                        );
                      }
                    }}
                    style={({ pressed }) => [
                      styles.friendChip,
                      {
                        backgroundColor: isSelected
                          ? (isDark ? 'rgba(16,185,129,0.18)' : '#ECFDF5')
                          : theme.card,
                        borderColor: isSelected ? theme.primary : theme.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Avatar name={f.fullName} size="sm" />
                    <View style={{ marginLeft: 8 }}>
                      <Text
                        style={{
                          color: isSelected ? theme.primary : theme.text,
                          fontWeight: isSelected ? '700' : '600',
                          fontSize: 13,
                        }}
                      >
                        {f.fullName}
                      </Text>
                      {balanceMinor !== 0 && (
                        <Text
                          style={{
                            fontSize: 10,
                            fontVariant: ['tabular-nums'],
                            fontWeight: '600',
                            color: balanceMinor > 0 ? theme.positive : theme.negative,
                          }}
                        >
                          {balanceMinor > 0 ? 'owes you' : 'you owe'}{' '}
                          {formatCurrency(Math.abs(balanceMinor), user?.defaultCurrency || 'INR')}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={theme.primary}
                        style={{ marginLeft: 8 }}
                      />
                    )}
                  </Pressable>
                );
              })
            ) : (
              <View
                style={[
                  styles.emptyFriendsPill,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                  Add connections in Friends tab to pick recipients
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Settlement Amount Card */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: 20 }}
        >
          <Text
            style={[
              styles.amountLabel,
              { color: theme.textMuted, fontSize: typography.fontSize.xs },
            ]}
          >
            SETTLEMENT AMOUNT
          </Text>

          <View style={styles.amountInputRow}>
            <Text style={[styles.currencySymbol, { color: theme.primary }]}>
              {user?.defaultCurrency === 'USD' ? '$' : user?.defaultCurrency === 'EUR' ? '€' : '₹'}
            </Text>
            <TextInput
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              value={amountStr}
              onChangeText={setAmountStr}
              keyboardType="decimal-pad"
              style={[
                styles.amountInput,
                { color: theme.text, fontVariant: ['tabular-nums'] },
              ]}
              autoFocus={!initialAmountStr}
            />
          </View>

          {/* Settle Full pill if net balance exists */}
          {selectedFriend && (selectedFriend.netBalanceMinor || selectedFriend.balanceMinor) ? (
            <View style={styles.balanceSuggestionRow}>
              <View style={styles.balanceInfoWrap}>
                <Ionicons name="information-circle-outline" size={15} color={theme.textMuted} style={{ marginRight: 4 }} />
                <Text style={{ color: theme.textMuted, fontSize: 12, fontVariant: ['tabular-nums'] }}>
                  Net balance:{' '}
                  <Text style={{ fontWeight: '700', color: theme.text }}>
                    {formatCurrency(
                      Math.abs(selectedFriend.netBalanceMinor || selectedFriend.balanceMinor),
                      user?.defaultCurrency || 'INR'
                    )}
                  </Text>
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setAmountStr(
                    fromMinorUnits(
                      Math.abs(selectedFriend.netBalanceMinor || selectedFriend.balanceMinor),
                      user?.defaultCurrency || 'INR'
                    ).toString()
                  )
                }
                style={({ pressed }) => [
                  styles.settleFullPill,
                  {
                    backgroundColor: isDark ? 'rgba(16,185,129,0.18)' : '#D1FAE5',
                    borderColor: theme.primary,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name="sparkles" size={11} color={theme.primary} style={{ marginRight: 4 }} />
                <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 11 }}>
                  Settle Full
                </Text>
              </Pressable>
            </View>
          ) : null}
        </Card>

        {/* Payment Method Selector */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.textMuted, fontSize: typography.fontSize.xs, marginBottom: 10 },
            ]}
          >
            PAYMENT METHOD
          </Text>

          <View style={styles.methodsGrid}>
            {paymentMethods.map((m) => {
              const isSelected = paymentMethod === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setPaymentMethod(m.id)}
                  style={({ pressed }) => [
                    styles.methodCard,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(16,185,129,0.14)' : '#ECFDF5')
                        : theme.card,
                      borderColor: isSelected ? theme.primary : theme.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <View style={styles.methodHeaderRow}>
                    <View
                      style={[
                        styles.methodIconCircle,
                        {
                          backgroundColor: isSelected
                            ? theme.primary
                            : (isDark ? '#1E293B' : '#F1F5F9'),
                        },
                      ]}
                    >
                      <Ionicons
                        name={m.icon}
                        size={18}
                        color={isSelected ? '#FFFFFF' : theme.text}
                      />
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                    )}
                  </View>

                  <Text
                    style={{
                      color: isSelected ? theme.primary : theme.text,
                      fontWeight: '700',
                      fontSize: 13,
                      marginTop: 10,
                    }}
                  >
                    {m.label}
                  </Text>
                  <Text
                    style={{
                      color: theme.textMuted,
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    {m.subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Notes & Reference */}
        <Input
          label="Transaction Reference or Note (Optional)"
          placeholder="e.g. UPI Ref / GPay Ref #987654"
          value={notes}
          onChangeText={setNotes}
          leftIcon={<Ionicons name="document-text-outline" size={18} color={theme.textMuted} />}
        />

        {/* Action Button */}
        <Button
          label={
            createSettlementMutation.isPending
              ? 'Recording Settlement...'
              : 'Record Payment'
          }
          size="lg"
          variant="primary"
          fullWidth
          loading={createSettlementMutation.isPending}
          onPress={handleRecordSettlement}
          icon={<Ionicons name="checkmark-done" size={18} color="#FFFFFF" />}
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  cancelBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  friendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyFriendsPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  amountLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  currencySymbol: {
    fontSize: 34,
    fontWeight: '800',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 34,
    fontWeight: '800',
    flex: 1,
    paddingVertical: 0,
  },
  balanceSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  balanceInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settleFullPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  methodCard: {
    width: '48.5%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  methodHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
