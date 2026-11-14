import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Avatar,
  Input,
  SegmentedControl,
  Button,
} from '@/components';
import { useWatermelonTheme } from '@/theme';
import {
  useCreateExpense,
  useMyGroups,
  useFriends,
} from '../../src/hooks/useQueries';
import { useAuthStore } from '../../src/stores/authStore';
import { useThemeStore } from '../../src/stores/themeStore';
import {
  ExpenseCategory,
  SplitType,
  CurrencyCode,
  toMinorUnits,
  formatCurrency,
  resolveSplit,
} from '@matrixsplit/shared';

const categoryOptions: {
  label: string;
  value: ExpenseCategory;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { label: 'Food & Drink', value: 'food_and_drink', icon: 'restaurant-outline', color: '#F59E0B' },
  { label: 'Groceries', value: 'groceries', icon: 'cart-outline', color: '#10B981' },
  { label: 'Transport', value: 'transport', icon: 'car-outline', color: '#3B82F6' },
  { label: 'Housing', value: 'housing', icon: 'home-outline', color: '#8B5CF6' },
  { label: 'Entertainment', value: 'entertainment', icon: 'film-outline', color: '#EC4899' },
  { label: 'Travel', value: 'travel', icon: 'airplane-outline', color: '#06B6D4' },
  { label: 'Utilities', value: 'utilities', icon: 'flash-outline', color: '#F97316' },
  { label: 'Shopping', value: 'shopping', icon: 'bag-handle-outline', color: '#EAB308' },
  { label: 'Health', value: 'health', icon: 'medkit-outline', color: '#EF4444' },
  { label: 'General', value: 'general', icon: 'receipt-outline', color: '#64748B' },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    preselectedGroupId?: string;
  }>();
  const preselectedGroupId = params?.preselectedGroupId;
  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();
  const { toggleTheme } = useThemeStore();
  const user = useAuthStore((s) => s.user);

  const { data: groups } = useMyGroups();
  const { data: friends } = useFriends();
  const createExpenseMutation = useCreateExpense();

  // Form State
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(
    user?.defaultCurrency || 'INR'
  );
  const [category, setCategory] = useState<ExpenseCategory>('food_and_drink');
  const [groupId, setGroupId] = useState<string | null>(
    preselectedGroupId || null
  );
  const [payerId, setPayerId] = useState<string>(user?.id || '');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [notes, setNotes] = useState('');

  // Available participants list
  const [participants, setParticipants] = useState<
    {
      userId: string;
      fullName: string;
      selected: boolean;
      exactAmountStr: string;
      percentageStr: string;
      sharesStr: string;
    }[]
  >([]);

  // Setup participants list on group/friend selection change
  useEffect(() => {
    if (!user) return;

    if (groupId) {
      const selectedGroup = groups?.find((g: any) => g.id === groupId);
      if (selectedGroup && selectedGroup.members) {
        setParticipants(
          selectedGroup.members.map((m: any) => ({
            userId: m.userId,
            fullName: m.userId === user.id ? `${m.user.fullName} (You)` : m.user.fullName,
            selected: true,
            exactAmountStr: '',
            percentageStr: '',
            sharesStr: '1',
          }))
        );
        return;
      }
    }

    // Default non-group participants (current user + friends)
    const list = [
      {
        userId: user.id,
        fullName: `${user.fullName} (You)`,
        selected: true,
        exactAmountStr: '',
        percentageStr: '',
        sharesStr: '1',
      },
    ];

    if (friends && friends.length > 0) {
      for (const f of friends) {
        list.push({
          userId: f.id,
          fullName: f.fullName,
          selected: true,
          exactAmountStr: '',
          percentageStr: '',
          sharesStr: '1',
        });
      }
    }

    setParticipants(list);
  }, [groupId, groups, friends, user]);

  const toggleParticipant = (userId: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.userId === userId ? { ...p, selected: !p.selected } : p
      )
    );
  };

  const updateExactAmount = (userId: string, val: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.userId === userId ? { ...p, exactAmountStr: val } : p
      )
    );
  };

  const updatePercentage = (userId: string, val: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, percentageStr: val } : p))
    );
  };

  const updateShares = (userId: string, val: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, sharesStr: val } : p))
    );
  };

  // Calculations for live split breakdown
  const totalMinor = useMemo(() => {
    return toMinorUnits(amountStr || '0', currency);
  }, [amountStr, currency]);

  const selectedParticipants = useMemo(() => {
    return participants.filter((p) => p.selected);
  }, [participants]);

  const splitBreakdown = useMemo(() => {
    if (totalMinor <= 0 || selectedParticipants.length === 0) return null;

    if (splitType === 'equal') {
      const perPerson = Math.floor(totalMinor / selectedParticipants.length);
      return {
        type: 'equal',
        perPerson,
        valid: true,
        message: `Each person owes ${formatCurrency(perPerson, currency)}`,
      };
    }

    if (splitType === 'exact') {
      const assignedSum = selectedParticipants.reduce(
        (sum, p) => sum + toMinorUnits(p.exactAmountStr || '0', currency),
        0
      );
      const remaining = totalMinor - assignedSum;
      return {
        type: 'exact',
        assignedSum,
        remaining,
        valid: remaining === 0,
        message:
          remaining === 0
            ? 'Amounts matched perfectly!'
            : remaining > 0
            ? `${formatCurrency(remaining, currency)} remaining to allocate`
            : `${formatCurrency(Math.abs(remaining), currency)} over allocated`,
      };
    }

    if (splitType === 'percentage') {
      const totalPercent = selectedParticipants.reduce(
        (sum, p) => sum + (parseFloat(p.percentageStr || '0') || 0),
        0
      );
      const valid = Math.abs(totalPercent - 100) < 0.01;
      return {
        type: 'percentage',
        totalPercent,
        valid,
        message: valid
          ? 'Percentages equal 100%!'
          : `Total is ${totalPercent.toFixed(1)}% (must be 100%)`,
      };
    }

    if (splitType === 'shares') {
      const totalShares = selectedParticipants.reduce(
        (sum, p) => sum + (parseInt(p.sharesStr || '1', 10) || 1),
        0
      );
      return {
        type: 'shares',
        totalShares,
        valid: totalShares > 0,
        message: `${totalShares} total shares calculated`,
      };
    }

    return null;
  }, [totalMinor, selectedParticipants, splitType, currency]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter what this expense was for');
      return;
    }

    if (totalMinor <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount');
      return;
    }

    if (selectedParticipants.length === 0) {
      Alert.alert('Participants Required', 'Select at least one participant');
      return;
    }

    if (splitBreakdown && !splitBreakdown.valid) {
      Alert.alert('Split Mismatch', splitBreakdown.message);
      return;
    }

    try {
      const participantInputs = selectedParticipants.map((p) => {
        if (splitType === 'exact') {
          return {
            userId: p.userId,
            allocatedAmountMinor: toMinorUnits(
              p.exactAmountStr || '0',
              currency
            ),
          };
        } else if (splitType === 'percentage') {
          return {
            userId: p.userId,
            percentage: parseFloat(p.percentageStr || '0'),
          };
        } else if (splitType === 'shares') {
          return {
            userId: p.userId,
            shares: parseInt(p.sharesStr || '1', 10),
          };
        } else {
          return { userId: p.userId };
        }
      });

      resolveSplit(splitType, totalMinor, participantInputs);

      await createExpenseMutation.mutateAsync({
        title: title.trim(),
        totalAmountMinor: totalMinor,
        currency,
        category,
        date: new Date().toISOString(),
        payerId: payerId || user!.id,
        groupId: groupId || null,
        splitType,
        notes: notes.trim() || undefined,
        participants: participantInputs,
      });

      Alert.alert('Success', 'Expense recorded successfully!', [
        {
          text: 'OK',
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          },
        },
      ]);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || 'Failed to save expense';
      Alert.alert('Error', msg);
    }
  };

  const getCurrencySymbol = (curr: CurrencyCode) => {
    switch (curr) {
      case 'INR':
        return '₹';
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      default:
        return curr;
    }
  };

  const selectedCategoryObj = categoryOptions.find((c) => c.value === category);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Top Header Bar */}
        <View
          style={[
            styles.headerBar,
            {
              borderBottomColor: theme.divider,
              backgroundColor: theme.surface,
            },
          ]}
        >
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => [
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="close" size={20} color={theme.text} />
          </Pressable>

          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                color: theme.text,
                fontSize: typography.fontSize.base,
                fontWeight: '700',
              }}
            >
              Add Expense
            </Text>
            <Text
              style={{
                color: theme.textMuted,
                fontSize: typography.fontSize.xs,
                marginTop: 2,
              }}
            >
              {groupId ? 'Group Expense' : 'Personal / Friends'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              onPress={toggleTheme}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={18}
                color={isDark ? '#F59E0B' : theme.text}
              />
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={createExpenseMutation.isPending || !title.trim() || totalMinor <= 0}
              style={({ pressed }) => [
                {
                  backgroundColor: theme.primary,
                  opacity:
                    createExpenseMutation.isPending || !title.trim() || totalMinor <= 0
                      ? 0.5
                      : pressed
                      ? 0.85
                      : 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                },
              ]}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text
                style={{
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: 12,
                  marginLeft: 4,
                }}
              >
                Save
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Amount & Description Card */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderRadius: borderRadius.xl,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: typography.fontSize.xs,
                  fontWeight: '600',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                Amount
              </Text>
              <View
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    color: theme.text,
                    fontSize: typography.fontSize.xs,
                    fontWeight: '700',
                  }}
                >
                  {currency}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 36,
                  fontWeight: '800',
                  marginRight: 6,
                }}
              >
                {getCurrencySymbol(currency)}
              </Text>
              <TextInput
                placeholder="0.00"
                placeholderTextColor={theme.textMuted}
                value={amountStr}
                onChangeText={setAmountStr}
                keyboardType="decimal-pad"
                style={{
                  color: theme.text,
                  fontSize: 36,
                  fontWeight: '800',
                  flex: 1,
                  paddingVertical: 0,
                  paddingHorizontal: 0,
                }}
              />
            </View>

            <View style={{ height: 1, backgroundColor: theme.divider, marginVertical: 12 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Ionicons
                  name={selectedCategoryObj?.icon || 'receipt-outline'}
                  size={18}
                  color={theme.primary}
                />
              </View>
              <TextInput
                placeholder="What was this expense for? (e.g. Dinner, Taxi)"
                placeholderTextColor={theme.textMuted}
                value={title}
                onChangeText={setTitle}
                style={{
                  color: theme.text,
                  fontSize: typography.fontSize.sm,
                  fontWeight: '500',
                  flex: 1,
                  paddingVertical: 0,
                }}
              />
            </View>
          </View>

          {/* Group Selector */}
          {groups && groups.length > 0 && (
            <View style={{ marginVertical: 8 }}>
              <Text
                style={{
                  color: theme.text,
                  fontSize: typography.fontSize.sm,
                  fontWeight: '700',
                  marginBottom: 8,
                }}
              >
                Choose Group
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Pressable
                  onPress={() => setGroupId(null)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: groupId === null ? theme.primary : theme.surface,
                      borderColor: groupId === null ? theme.primary : theme.border,
                      borderWidth: 1,
                      borderRadius: borderRadius.md,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginRight: 8,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={groupId === null ? '#FFFFFF' : theme.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      color: groupId === null ? '#FFFFFF' : theme.text,
                      fontSize: typography.fontSize.xs,
                      fontWeight: groupId === null ? '700' : '500',
                    }}
                  >
                    Non-group / Direct
                  </Text>
                </Pressable>

                {groups.map((g: any) => {
                  const isSelected = groupId === g.id;
                  return (
                    <Pressable
                      key={g.id}
                      onPress={() => setGroupId(g.id)}
                      style={({ pressed }) => [
                        {
                          backgroundColor: isSelected ? theme.primary : theme.surface,
                          borderColor: isSelected ? theme.primary : theme.border,
                          borderWidth: 1,
                          borderRadius: borderRadius.md,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginRight: 8,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name="folder-outline"
                        size={16}
                        color={isSelected ? '#FFFFFF' : theme.textMuted}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={{
                          color: isSelected ? '#FFFFFF' : theme.text,
                          fontSize: typography.fontSize.xs,
                          fontWeight: isSelected ? '700' : '500',
                        }}
                      >
                        {g.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Category Selector Chips */}
          <View style={{ marginVertical: 8 }}>
            <Text
              style={{
                color: theme.text,
                fontSize: typography.fontSize.sm,
                fontWeight: '700',
                marginBottom: 8,
              }}
            >
              Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categoryOptions.map((opt) => {
                const isSelected = category === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setCategory(opt.value)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(16,185,129,0.2)'
                            : '#D1FAE5'
                          : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                        borderWidth: 1,
                        borderRadius: borderRadius.md,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginRight: 8,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={16}
                      color={isSelected ? theme.primary : theme.textMuted}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        color: isSelected ? theme.primary : theme.text,
                        fontSize: typography.fontSize.xs,
                        fontWeight: isSelected ? '700' : '500',
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Paid By Selector */}
          <View style={{ marginVertical: 8 }}>
            <Text
              style={{
                color: theme.text,
                fontSize: typography.fontSize.sm,
                fontWeight: '700',
                marginBottom: 8,
              }}
            >
              Paid By
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {participants.map((p) => {
                const isSelected = payerId === p.userId;
                return (
                  <Pressable
                    key={p.userId}
                    onPress={() => setPayerId(p.userId)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(16,185,129,0.2)'
                            : '#D1FAE5'
                          : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                        borderWidth: 1,
                        borderRadius: borderRadius.md,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginRight: 8,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Avatar name={p.fullName} size="sm" />
                    <Text
                      style={{
                        color: isSelected ? theme.primary : theme.text,
                        fontSize: typography.fontSize.xs,
                        fontWeight: isSelected ? '700' : '500',
                        marginLeft: 8,
                      }}
                    >
                      {p.fullName}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={theme.primary}
                        style={{ marginLeft: 6 }}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Split Type Selector */}
          <View style={{ marginVertical: 8 }}>
            <Text
              style={{
                color: theme.text,
                fontSize: typography.fontSize.sm,
                fontWeight: '700',
                marginBottom: 8,
              }}
            >
              Split Method
            </Text>
            <SegmentedControl
              value={splitType}
              onChange={(val) => setSplitType(val as SplitType)}
              options={[
                { value: 'equal', label: 'Equal (=)' },
                { value: 'exact', label: 'Exact ($)' },
                { value: 'percentage', label: 'Percent (%)' },
                { value: 'shares', label: 'Shares (x)' },
              ]}
            />

            {/* Split Status Banner */}
            {splitBreakdown && (
              <View
                style={{
                  backgroundColor: splitBreakdown.valid
                    ? (isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5')
                    : (isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2'),
                  borderColor: splitBreakdown.valid
                    ? (isDark ? '#065F46' : '#A7F3D0')
                    : (isDark ? '#991B1B' : '#FECACA'),
                  borderWidth: 1,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 10,
                }}
              >
                <Ionicons
                  name={splitBreakdown.valid ? 'information-circle' : 'alert-circle'}
                  size={16}
                  color={splitBreakdown.valid ? theme.positive : theme.negative}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    color: splitBreakdown.valid ? theme.positive : theme.negative,
                    fontSize: typography.fontSize.xs,
                    fontWeight: '600',
                  }}
                >
                  {splitBreakdown.message}
                </Text>
              </View>
            )}
          </View>

          {/* Participants Allocation List */}
          <View style={{ marginVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text
                style={{
                  color: theme.text,
                  fontSize: typography.fontSize.sm,
                  fontWeight: '700',
                }}
              >
                Split Between ({selectedParticipants.length} selected)
              </Text>
              <Pressable
                onPress={() => {
                  const allSelected = participants.every((p) => p.selected);
                  setParticipants((prev) =>
                    prev.map((p) => ({ ...p, selected: !allSelected }))
                  );
                }}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <Text
                  style={{
                    color: theme.primary,
                    fontSize: typography.fontSize.xs,
                    fontWeight: '600',
                  }}
                >
                  {participants.every((p) => p.selected) ? 'Deselect all' : 'Select all'}
                </Text>
              </Pressable>
            </View>

            {participants.map((p) => {
              const perPersonMinor =
                splitType === 'equal' && selectedParticipants.length > 0
                  ? Math.floor(totalMinor / selectedParticipants.length)
                  : 0;

              return (
                <View
                  key={p.userId}
                  style={{
                    backgroundColor: isDark ? '#161F30' : '#FFFFFF',
                    borderColor: p.selected ? theme.primary : theme.border,
                    borderRadius: borderRadius.lg,
                    borderWidth: 1,
                    padding: 12,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Pressable
                    onPress={() => toggleParticipant(p.userId)}
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <View
                      style={{
                        borderColor: p.selected ? theme.primary : theme.border,
                        backgroundColor: p.selected ? theme.primary : 'transparent',
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        borderWidth: 1.5,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                      }}
                    >
                      {p.selected && (
                        <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                      )}
                    </View>
                    <Avatar name={p.fullName} size="sm" />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text
                        style={{
                          color: theme.text,
                          fontSize: typography.fontSize.sm,
                          fontWeight: '600',
                        }}
                        numberOfLines={1}
                      >
                        {p.fullName}
                      </Text>
                      {p.selected && splitType === 'equal' && totalMinor > 0 && (
                        <Text
                          style={{
                            color: theme.primary,
                            fontSize: typography.fontSize.xs,
                            fontWeight: '700',
                            marginTop: 2,
                          }}
                        >
                          {formatCurrency(perPersonMinor, currency)}
                        </Text>
                      )}
                    </View>
                  </Pressable>

                  {/* Input field for non-equal splits */}
                  {p.selected && (
                    <View style={{ marginLeft: 8 }}>
                      {splitType === 'exact' && (
                        <View
                          style={{
                            backgroundColor: isDark ? '#111827' : '#F1F5F9',
                            borderColor: theme.border,
                            borderWidth: 1,
                            borderRadius: 8,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              color: theme.textMuted,
                              fontSize: typography.fontSize.xs,
                              fontWeight: '700',
                              marginRight: 4,
                            }}
                          >
                            {getCurrencySymbol(currency)}
                          </Text>
                          <TextInput
                            placeholder="0.00"
                            placeholderTextColor={theme.textMuted}
                            value={p.exactAmountStr}
                            onChangeText={(val) => updateExactAmount(p.userId, val)}
                            keyboardType="decimal-pad"
                            style={{
                              color: theme.text,
                              fontSize: typography.fontSize.xs,
                              fontWeight: '700',
                              width: 65,
                              textAlign: 'right',
                              paddingVertical: 0,
                            }}
                          />
                        </View>
                      )}

                      {splitType === 'percentage' && (
                        <View
                          style={{
                            backgroundColor: isDark ? '#111827' : '#F1F5F9',
                            borderColor: theme.border,
                            borderWidth: 1,
                            borderRadius: 8,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <TextInput
                            placeholder="0"
                            placeholderTextColor={theme.textMuted}
                            value={p.percentageStr}
                            onChangeText={(val) => updatePercentage(p.userId, val)}
                            keyboardType="decimal-pad"
                            style={{
                              color: theme.text,
                              fontSize: typography.fontSize.xs,
                              fontWeight: '700',
                              width: 45,
                              textAlign: 'right',
                              paddingVertical: 0,
                            }}
                          />
                          <Text
                            style={{
                              color: theme.textMuted,
                              fontSize: typography.fontSize.xs,
                              fontWeight: '700',
                              marginLeft: 4,
                            }}
                          >
                            %
                          </Text>
                        </View>
                      )}

                      {splitType === 'shares' && (
                        <View
                          style={{
                            backgroundColor: isDark ? '#111827' : '#F1F5F9',
                            borderColor: theme.border,
                            borderWidth: 1,
                            borderRadius: 8,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <TextInput
                            placeholder="1"
                            placeholderTextColor={theme.textMuted}
                            value={p.sharesStr}
                            onChangeText={(val) => updateShares(p.userId, val)}
                            keyboardType="number-pad"
                            style={{
                              color: theme.text,
                              fontSize: typography.fontSize.xs,
                              fontWeight: '700',
                              width: 35,
                              textAlign: 'center',
                              paddingVertical: 0,
                            }}
                          />
                          <Text
                            style={{
                              color: theme.textMuted,
                              fontSize: typography.fontSize.xs,
                              fontWeight: '700',
                              marginLeft: 4,
                            }}
                          >
                            share{p.sharesStr !== '1' ? 's' : ''}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Notes Input */}
          <View style={{ marginVertical: 8 }}>
            <Input
              label="Notes (Optional)"
              placeholder="Add payment method, notes, or items purchased..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
              style={{ minHeight: 56 }}
            />
          </View>

          {/* Primary Save Button */}
          <View style={{ marginTop: 14, marginBottom: 36 }}>
            <Button
              label={
                createExpenseMutation.isPending
                  ? 'Saving Expense...'
                  : totalMinor > 0
                  ? `Save Expense (${formatCurrency(totalMinor, currency)})`
                  : 'Save Expense'
              }
              onPress={handleSave}
              disabled={
                createExpenseMutation.isPending || !title.trim() || totalMinor <= 0
              }
              loading={createExpenseMutation.isPending}
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
});
