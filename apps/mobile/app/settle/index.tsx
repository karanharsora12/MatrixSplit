import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Button,
  Input,
  Avatar,
  useWatermelonTheme,
} from '@matrixsplit/watermelon-ui';
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

  const { theme, typography, spacing, borderRadius } = useWatermelonTheme();
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
    icon: string;
  }[] = [
    { id: 'upi', label: 'UPI / QR', icon: '📱' },
    { id: 'cash', label: 'Cash', icon: '💵' },
    { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
    { id: 'other', label: 'Other', icon: '💳' },
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
        'Payment has been recorded! It will update balances and is pending confirmation from the recipient.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to record settlement');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.headerBar,
          { backgroundColor: theme.surface, borderBottomColor: theme.divider },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={{ color: theme.textMuted, fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.text, fontSize: typography.fontSize.lg },
          ]}
        >
          Record Settlement
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Settlement Amount Card */}
        <View
          style={[
            styles.amountCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderRadius: borderRadius.xl,
            },
          ]}
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
            <Text
              style={[
                styles.currencySymbol,
                { color: theme.primary, fontSize: typography.fontSize['4xl'] },
              ]}
            >
              {user?.defaultCurrency === 'INR' ? '₹' : '$'}
            </Text>
            <Input
              placeholder="0.00"
              value={amountStr}
              onChangeText={setAmountStr}
              keyboardType="decimal-pad"
              style={[
                styles.amountInput,
                { color: theme.text, fontSize: typography.fontSize['3xl'] },
              ]}
              containerStyle={{ flex: 1, borderWidth: 0 }}
            />
          </View>
        </View>

        {/* Recipient Picker */}
        <View style={{ marginVertical: 12 }}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            Settling With
          </Text>

          {params.targetName && (
            <View
              style={[
                styles.targetCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.primary,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Avatar name={params.targetName} size="sm" />
              <Text
                style={[
                  styles.targetNameText,
                  { color: theme.text, marginLeft: 10 },
                ]}
              >
                {params.targetName}
              </Text>
            </View>
          )}

          {!params.targetUserId && friends && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {friends.map((f: any) => {
                const isSelected = selectedFriendId === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setSelectedFriendId(f.id)}
                    style={[
                      styles.friendChip,
                      {
                        backgroundColor: isSelected
                          ? theme.primary
                          : theme.surface,
                        borderColor: isSelected
                          ? theme.primary
                          : theme.border,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                  >
                    <Avatar name={f.fullName} size="sm" />
                    <Text
                      style={{
                        color: isSelected ? '#FFFFFF' : theme.text,
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: 12,
                        marginLeft: 8,
                      }}
                    >
                      {f.fullName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Payment Method Selector */}
        <View style={{ marginVertical: 12 }}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            Payment Method
          </Text>
          <View style={styles.methodsGrid}>
            {paymentMethods.map((m) => {
              const isSelected = paymentMethod === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setPaymentMethod(m.id)}
                  style={[
                    styles.methodCard,
                    {
                      backgroundColor: isSelected
                        ? theme.primaryLight
                        : theme.surface,
                      borderColor: isSelected
                        ? theme.primary
                        : theme.border,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>
                    {m.icon}
                  </Text>
                  <Text
                    style={{
                      color: isSelected ? theme.primary : theme.text,
                      fontWeight: isSelected ? '700' : '500',
                      fontSize: 12,
                    }}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <Input
          label="Payment Note / Transaction Reference"
          placeholder="e.g. UPI ref #9382103, GPay, cash given at cafe"
          value={notes}
          onChangeText={setNotes}
        />

        <Button
          label="Confirm & Record Settlement"
          size="lg"
          onPress={handleRecordSettlement}
          loading={createSettlementMutation.isPending}
          style={{ marginTop: spacing.xl }}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cancelBtn: {
    padding: 6,
  },
  headerTitle: {
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  amountCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  amountLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontWeight: '800',
    marginRight: 6,
  },
  amountInput: {
    fontWeight: '800',
    fontSize: 32,
  },
  sectionLabel: {
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 8,
  },
  targetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1.5,
  },
  targetNameText: {
    fontWeight: '700',
    fontSize: 15,
  },
  friendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  methodCard: {
    flexBasis: '48%',
    flexGrow: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
