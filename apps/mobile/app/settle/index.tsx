import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { cn } from '@/lib/utils';

export default function SettleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    groupId?: string;
    targetUserId?: string;
    targetName?: string;
    amountMinor?: string;
  }>();

  const { isDark } = useWatermelonTheme();
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
        'Payment has been recorded! It updates mutual balances and settles shared debts.',
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to record settlement');
    }
  };

  const selectedFriend = friends?.find((f: any) => f.id === selectedFriendId);
  const targetFriendName = selectedFriend?.fullName || params.targetName;

  const currencySymbol =
    user?.defaultCurrency === 'USD'
      ? '$'
      : user?.defaultCurrency === 'EUR'
      ? '€'
      : user?.defaultCurrency === 'GBP'
      ? '£'
      : '₹';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className={cn('flex-1', isDark ? 'bg-[#090D16]' : 'bg-[#F8FAFC]')}
    >
      {/* Top Header Bar */}
      <View
        className={cn(
          'flex-row items-center justify-between px-5 pt-3 pb-3 border-b',
          isDark ? 'border-[#1E293B] bg-[#090D16]' : 'border-slate-200 bg-white'
        )}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className={cn(
            'w-9 h-9 rounded-xl items-center justify-center border active:scale-95',
            isDark
              ? 'bg-[#141D2E] border-[#23324D] active:bg-[#1E2A42]'
              : 'bg-white border-slate-200 active:bg-slate-100'
          )}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDark ? '#E2E8F0' : '#334155'}
          />
        </Pressable>

        <View className="items-center">
          <Text
            className={cn(
              'text-base font-extrabold tracking-tight',
              isDark ? 'text-white' : 'text-slate-900'
            )}
          >
            Record Settlement
          </Text>
          <Text className="text-xs text-slate-400 mt-0.5">
            Log direct payment between friends
          </Text>
        </View>

        <View className="w-9 h-9" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Recipient Selector */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-2.5">
            <Text
              className={cn(
                'text-xs font-bold tracking-wider uppercase',
                isDark ? 'text-slate-400' : 'text-slate-500'
              )}
            >
              Settling With
            </Text>
            {targetFriendName && (
              <Text className="text-xs font-bold text-emerald-500">
                Selected: {targetFriendName}
              </Text>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 10 }}
          >
            {/* If param target is present but friend not in list */}
            {params.targetUserId && !friends?.some((f: any) => f.id === params.targetUserId) && (
              <Pressable
                onPress={() => setSelectedFriendId(params.targetUserId!)}
                className={cn(
                  'h-10 px-3.5 rounded-full flex-row items-center mr-2.5 border active:scale-95',
                  selectedFriendId === params.targetUserId
                    ? 'bg-emerald-500 border-emerald-500 shadow-sm'
                    : isDark
                    ? 'bg-[#141D2E] border-[#23324D]'
                    : 'bg-white border-slate-200'
                )}
              >
                <View className="w-5 h-5 rounded-full bg-white/20 items-center justify-center mr-2">
                  <Text className="text-[10px] font-bold text-white">
                    {(params.targetName || 'F').slice(0, 1)}
                  </Text>
                </View>
                <Text
                  className={cn(
                    'text-xs font-bold',
                    selectedFriendId === params.targetUserId
                      ? 'text-white'
                      : isDark
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  )}
                >
                  {params.targetName || 'Friend'}
                </Text>
                {selectedFriendId === params.targetUserId && (
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color="#FFFFFF"
                    style={{ marginLeft: 5 }}
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
                    className={cn(
                      'h-10 px-3.5 rounded-full flex-row items-center mr-2.5 border active:scale-95',
                      isSelected
                        ? 'bg-emerald-500 border-emerald-500 shadow-sm'
                        : isDark
                        ? 'bg-[#141D2E] border-[#23324D]'
                        : 'bg-white border-slate-200'
                    )}
                  >
                    <View
                      className={cn(
                        'w-5 h-5 rounded-full items-center justify-center mr-2',
                        isSelected
                          ? 'bg-white/20'
                          : isDark
                          ? 'bg-[#1E293B]'
                          : 'bg-slate-200'
                      )}
                    >
                      <Text
                        className={cn(
                          'text-[10px] font-bold',
                          isSelected
                            ? 'text-white'
                            : isDark
                            ? 'text-slate-300'
                            : 'text-slate-700'
                        )}
                      >
                        {f.fullName.slice(0, 1)}
                      </Text>
                    </View>
                    <View>
                      <Text
                        className={cn(
                          'text-xs font-bold',
                          isSelected
                            ? 'text-white'
                            : isDark
                            ? 'text-slate-300'
                            : 'text-slate-700'
                        )}
                      >
                        {f.fullName}
                      </Text>
                      {balanceMinor !== 0 && (
                        <Text
                          className={cn(
                            'text-[9px] font-mono font-semibold',
                            isSelected
                              ? 'text-emerald-100'
                              : balanceMinor > 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          )}
                        >
                          {balanceMinor > 0 ? 'owes you' : 'you owe'}{' '}
                          {formatCurrency(Math.abs(balanceMinor), user?.defaultCurrency || 'INR')}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color="#FFFFFF"
                        style={{ marginLeft: 6 }}
                      />
                    )}
                  </Pressable>
                );
              })
            ) : (
              <View
                className={cn(
                  'px-4 py-2.5 rounded-2xl border',
                  isDark
                    ? 'bg-[#141D2E] border-[#23324D]'
                    : 'bg-white border-slate-200'
                )}
              >
                <Text className="text-xs text-slate-400">
                  Add connections in Friends tab to pick recipients
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Settlement Amount Card */}
        <View
          className={cn(
            'p-5 rounded-3xl border mb-5',
            isDark
              ? 'bg-[#141D2E] border-[#23324D]'
              : 'bg-white border-slate-200 shadow-sm shadow-black/5'
          )}
        >
          <Text className="text-xs font-bold text-slate-400 tracking-wider mb-1.5 uppercase">
            Settlement Amount
          </Text>

          <View className="flex-row items-center my-1">
            <Text className="text-3xl font-extrabold text-emerald-500 font-mono mr-2">
              {currencySymbol}
            </Text>
            <TextInput
              placeholder="0.00"
              placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
              value={amountStr}
              onChangeText={setAmountStr}
              keyboardType="decimal-pad"
              autoFocus={!initialAmountStr}
              className={cn(
                'text-3xl font-extrabold font-mono flex-1 py-0',
                isDark ? 'text-white' : 'text-slate-900'
              )}
            />
          </View>

          {/* Settle Full pill if net balance exists */}
          {selectedFriend && (selectedFriend.netBalanceMinor || selectedFriend.balanceMinor) ? (
            <View
              className={cn(
                'flex-row items-center justify-between pt-3 mt-3 border-t',
                isDark ? 'border-[#23324D]' : 'border-slate-100'
              )}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="information-circle-outline"
                  size={14}
                  color="#64748B"
                  style={{ marginRight: 4 }}
                />
                <Text className="text-xs text-slate-400 font-mono">
                  Net balance:{' '}
                  <Text
                    className={cn(
                      'font-bold',
                      isDark ? 'text-white' : 'text-slate-900'
                    )}
                  >
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
                className="flex-row items-center px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 active:scale-95"
              >
                <Ionicons
                  name="sparkles"
                  size={11}
                  color="#10B981"
                  style={{ marginRight: 3 }}
                />
                <Text className="text-[11px] font-bold text-emerald-400">
                  Settle Full
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Payment Method Selector */}
        <View className="mb-5">
          <Text
            className={cn(
              'text-xs font-bold tracking-wider mb-2.5 uppercase',
              isDark ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            Payment Method
          </Text>

          <View className="flex-row flex-wrap gap-2.5">
            {paymentMethods.map((m) => {
              const isSelected = paymentMethod === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setPaymentMethod(m.id)}
                  className={cn(
                    'w-[48%] p-3.5 rounded-2xl border active:scale-95',
                    isSelected
                      ? isDark
                        ? 'bg-emerald-500/15 border-emerald-500/50'
                        : 'bg-emerald-50 border-emerald-500'
                      : isDark
                      ? 'bg-[#141D2E] border-[#23324D]'
                      : 'bg-white border-slate-200 shadow-sm shadow-black/5'
                  )}
                >
                  <View className="flex-row items-center justify-between">
                    <View
                      className={cn(
                        'w-8 h-8 rounded-xl items-center justify-center',
                        isSelected
                          ? 'bg-emerald-500'
                          : isDark
                          ? 'bg-[#1E293B]'
                          : 'bg-slate-100'
                      )}
                    >
                      <Ionicons
                        name={m.icon}
                        size={16}
                        color={isSelected ? '#FFFFFF' : isDark ? '#E2E8F0' : '#475569'}
                      />
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#10B981"
                      />
                    )}
                  </View>

                  <Text
                    className={cn(
                      'text-xs font-bold mt-2.5',
                      isSelected
                        ? 'text-emerald-500'
                        : isDark
                        ? 'text-white'
                        : 'text-slate-900'
                    )}
                  >
                    {m.label}
                  </Text>
                  <Text className="text-[11px] text-slate-400 mt-0.5" numberOfLines={1}>
                    {m.subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Notes & Reference */}
        <View className="mb-6">
          <Text
            className={cn(
              'text-xs font-bold tracking-wider mb-2.5 uppercase',
              isDark ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            Transaction Note / Ref (Optional)
          </Text>
          <View
            className={cn(
              'flex-row items-center h-12 px-3.5 rounded-2xl border',
              isDark
                ? 'bg-[#141D2E] border-[#23324D]'
                : 'bg-white border-slate-200 shadow-sm shadow-black/5'
            )}
          >
            <Ionicons
              name="document-text-outline"
              size={17}
              color="#64748B"
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder="e.g. UPI Ref / GPay Ref #987654"
              placeholderTextColor="#64748B"
              value={notes}
              onChangeText={setNotes}
              className={cn(
                'flex-1 text-sm font-semibold py-0',
                isDark ? 'text-white' : 'text-slate-900'
              )}
            />
          </View>
        </View>

        {/* Action Button */}
        <Pressable
          onPress={handleRecordSettlement}
          disabled={createSettlementMutation.isPending || !selectedFriendId || !amountStr}
          className={cn(
            'h-13 py-3.5 rounded-2xl items-center justify-center flex-row active:scale-[0.98] shadow-md mb-8',
            createSettlementMutation.isPending || !selectedFriendId || !amountStr
              ? isDark
                ? 'bg-[#1A2333] opacity-60'
                : 'bg-slate-200 opacity-60'
              : 'bg-emerald-500 active:bg-emerald-600'
          )}
        >
          {createSettlementMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name="checkmark-done"
                size={18}
                color={
                  !selectedFriendId || !amountStr
                    ? isDark
                      ? '#64748B'
                      : '#94A3B8'
                    : '#FFFFFF'
                }
                style={{ marginRight: 6 }}
              />
              <Text
                className={cn(
                  'text-sm font-extrabold',
                  !selectedFriendId || !amountStr
                    ? isDark
                      ? 'text-slate-500'
                      : 'text-slate-400'
                    : 'text-white'
                )}
              >
                Record Payment
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
