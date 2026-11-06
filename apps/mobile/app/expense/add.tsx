import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Button,
  Input,
  SegmentedControl,
  Avatar,
  Badge,
  useWatermelonTheme,
} from '@matrixsplit/watermelon-ui';
import {
  useMyGroups,
  useFriends,
  useCreateExpense,
} from '../../src/hooks/useQueries';
import { useAuthStore } from '../../src/stores/authStore';
import {
  toMinorUnits,
  fromMinorUnits,
  formatCurrency,
  SplitType,
  ExpenseCategory,
  CurrencyCode,
  resolveSplit,
} from '@matrixsplit/shared';

const categoryOptions: { label: string; value: ExpenseCategory; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Food & Drink', value: 'food_and_drink', icon: 'fast-food-outline' },
  { label: 'Groceries', value: 'groceries', icon: 'cart-outline' },
  { label: 'Transport', value: 'transport', icon: 'car-outline' },
  { label: 'Housing', value: 'housing', icon: 'home-outline' },
  { label: 'Entertainment', value: 'entertainment', icon: 'film-outline' },
  { label: 'Travel', value: 'travel', icon: 'airplane-outline' },
  { label: 'Utilities', value: 'utilities', icon: 'bulb-outline' },
  { label: 'Shopping', value: 'shopping', icon: 'bag-handle-outline' },
  { label: 'Health', value: 'health', icon: 'medkit-outline' },
  { label: 'General', value: 'general', icon: 'receipt-outline' },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const { preselectedGroupId } = useLocalSearchParams<{ preselectedGroupId?: string }>();
  const { theme, typography, spacing, borderRadius } = useWatermelonTheme();
  const user = useAuthStore((s) => s.user);

  const { data: groups } = useMyGroups();
  const { data: friends } = useFriends();
  const createExpenseMutation = useCreateExpense();

  // Form State
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(user?.defaultCurrency || 'INR');
  const [category, setCategory] = useState<ExpenseCategory>('general');
  const [groupId, setGroupId] = useState<string | null>(preselectedGroupId || null);
  const [payerId, setPayerId] = useState<string>(user?.id || '');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [notes, setNotes] = useState('');

  // Available participants: if in a group, group members; else friends + current user
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

  // Setup participants list
  useEffect(() => {
    if (!user) return;

    if (groupId) {
      const selectedGroup = groups?.find((g: any) => g.id === groupId);
      if (selectedGroup && selectedGroup.members) {
        setParticipants(
          selectedGroup.members.map((m: any) => ({
            userId: m.userId,
            fullName: m.user.fullName,
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
      prev.map((p) => (p.userId === userId ? { ...p, exactAmountStr: val } : p))
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

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter an expense title');
      return;
    }

    const totalMinor = toMinorUnits(amountStr, currency);
    if (totalMinor <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount');
      return;
    }

    const selectedParticipants = participants.filter((p) => p.selected);
    if (selectedParticipants.length === 0) {
      Alert.alert('Participants Required', 'Select at least one participant');
      return;
    }

    try {
      // Build DTO
      const participantInputs = selectedParticipants.map((p) => {
        if (splitType === 'exact') {
          return {
            userId: p.userId,
            allocatedAmountMinor: toMinorUnits(p.exactAmountStr || '0', currency),
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

      // Verify client-side split resolution before sending
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
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save expense';
      Alert.alert('Validation Error', msg);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Top Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.text, fontSize: typography.fontSize.base },
            ]}
          >
            Add Expense
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={createExpenseMutation.isPending}
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Main Amount & Title Input */}
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
                styles.amountCardLabel,
                { color: theme.textMuted, fontSize: typography.fontSize.xs },
              ]}
            >
              EXPENSE AMOUNT ({currency})
            </Text>
            <View style={styles.amountInputRow}>
              <Text
                style={[
                  styles.currencySymbol,
                  { color: theme.primary, fontSize: typography.fontSize['4xl'] },
                ]}
              >
                {currency === 'INR' ? '₹' : '$'}
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

            <Input
              placeholder="What was this expense for? (e.g. Dinner, Taxi)"
              value={title}
              onChangeText={setTitle}
              containerStyle={{ marginTop: 8 }}
            />
          </View>

          {/* Group Selector */}
          {groups && groups.length > 0 && (
            <View style={{ marginVertical: 10 }}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>
                Group (Optional)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  onPress={() => setGroupId(null)}
                  style={[
                    styles.groupChip,
                    {
                      backgroundColor:
                        groupId === null ? theme.primary : theme.surface,
                      borderColor:
                        groupId === null ? theme.primary : theme.border,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: groupId === null ? '#FFFFFF' : theme.text,
                      fontWeight: groupId === null ? '700' : '500',
                      fontSize: 12,
                    }}
                  >
                    Non-group / Friends
                  </Text>
                </TouchableOpacity>

                {groups.map((g: any) => (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => setGroupId(g.id)}
                    style={[
                      styles.groupChip,
                      {
                        backgroundColor:
                          groupId === g.id ? theme.primary : theme.surface,
                        borderColor:
                          groupId === g.id ? theme.primary : theme.border,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: groupId === g.id ? '#FFFFFF' : theme.text,
                        fontWeight: groupId === g.id ? '700' : '500',
                        fontSize: 12,
                      }}
                    >
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Category Selector Chips */}
          <View style={{ marginVertical: 8 }}>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>
              Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categoryOptions.map((opt) => {
                const isSelected = category === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setCategory(opt.value)}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: isSelected
                          ? theme.primaryLight
                          : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                        borderRadius: borderRadius.md,
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
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: 12,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Paid By Selector */}
          <View style={{ marginVertical: 10 }}>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>
              Paid By
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {participants.map((p) => {
                const isSelected = payerId === p.userId;
                return (
                  <TouchableOpacity
                    key={p.userId}
                    onPress={() => setPayerId(p.userId)}
                    style={[
                      styles.payerChip,
                      {
                        backgroundColor: isSelected
                          ? theme.primary
                          : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                  >
                    <Avatar name={p.fullName} size="sm" />
                    <Text
                      style={{
                        color: isSelected ? '#FFFFFF' : theme.text,
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: 12,
                        marginLeft: 8,
                      }}
                    >
                      {p.fullName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Split Type Selector */}
          <View style={{ marginVertical: 10 }}>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>
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
          </View>

          {/* Participants Allocation Input List */}
          <View style={{ marginVertical: 8 }}>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>
              Split Between
            </Text>
            {participants.map((p) => (
              <View
                key={p.userId}
                style={[
                  styles.participantRow,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => toggleParticipant(p.userId)}
                  style={styles.participantLeft}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: p.selected ? theme.primary : theme.border,
                        backgroundColor: p.selected
                          ? theme.primary
                          : 'transparent',
                      },
                    ]}
                  >
                    {p.selected && (
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.participantName,
                      { color: theme.text, marginLeft: 10 },
                    ]}
                  >
                    {p.fullName}
                  </Text>
                </TouchableOpacity>

                {/* Right Input depending on split type */}
                {p.selected && (
                  <View style={styles.participantRight}>
                    {splitType === 'exact' && (
                      <Input
                        placeholder="0.00"
                        value={p.exactAmountStr}
                        onChangeText={(val) => updateExactAmount(p.userId, val)}
                        keyboardType="decimal-pad"
                        containerStyle={{ width: 90, marginVertical: 0 }}
                      />
                    )}
                    {splitType === 'percentage' && (
                      <Input
                        placeholder="%"
                        value={p.percentageStr}
                        onChangeText={(val) => updatePercentage(p.userId, val)}
                        keyboardType="decimal-pad"
                        containerStyle={{ width: 70, marginVertical: 0 }}
                      />
                    )}
                    {splitType === 'shares' && (
                      <Input
                        placeholder="1"
                        value={p.sharesStr}
                        onChangeText={(val) => updateShares(p.userId, val)}
                        keyboardType="number-pad"
                        containerStyle={{ width: 60, marginVertical: 0 }}
                      />
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Notes Input */}
          <Input
            label="Notes (Optional)"
            placeholder="Add receipt details, notes, or items purchased..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  cancelBtn: {
    padding: 6,
  },
  headerTitle: {
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
  amountCardLabel: {
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
  groupChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  payerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantName: {
    fontWeight: '600',
    fontSize: 14,
  },
  participantRight: {
    marginLeft: 10,
  },
});
