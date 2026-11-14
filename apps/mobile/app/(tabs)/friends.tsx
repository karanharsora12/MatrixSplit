import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Card,
  Avatar,
  BalancePill,
  Button,
  Input,
  BottomSheet,
  SkeletonCard,
  SegmentedControl,
} from '@/components';
import { useWatermelonTheme } from '@/theme';
import {
  useFriends,
  usePendingFriendRequests,
  useSendFriendRequest,
  useRespondFriendRequest,
} from '../../src/hooks/useQueries';
import { apiClient } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';

export default function FriendsScreen() {
  const router = useRouter();
  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();
  const currentUser = useAuthStore((s) => s.user);

  const { data: friends, isLoading, refetch, isRefetching } = useFriends();
  const { data: pendingRequests, refetch: refetchRequests } =
    usePendingFriendRequests();

  const sendRequestMutation = useSendFriendRequest();
  const respondRequestMutation = useRespondFriendRequest();

  const [filter, setFilter] = useState<'all' | 'owed' | 'owe' | 'settled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [qrSheetVisible, setQrSheetVisible] = useState(false);

  // Search in add sheet
  const [addSearchText, setAddSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const onRefresh = () => {
    refetch();
    refetchRequests();
  };

  const handleSearchUsers = async (text: string) => {
    setAddSearchText(text);
    if (text.trim().length > 1) {
      setSearching(true);
      try {
        const res = await apiClient.get(`/users/search?q=${encodeURIComponent(text.trim())}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSendRequest = async (emailOrId: string) => {
    try {
      await sendRequestMutation.mutateAsync(emailOrId);
      Alert.alert('Sent', 'Friend request sent successfully!');
      setAddSheetVisible(false);
      setAddSearchText('');
      setSearchResults([]);
      refetchRequests();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleRespond = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      await respondRequestMutation.mutateAsync({ id: requestId, action });
      refetch();
      refetchRequests();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to respond');
    }
  };

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Add me on MatrixSplit! My registered email is: ${currentUser?.email || ''}. Download MatrixSplit to easily split bills and expenses together!`,
        title: 'MatrixSplit Friend Invite',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFriends = useMemo(() => {
    if (!friends) return [];
    return friends.filter((f: any) => {
      const matchesSearch =
        !searchQuery ||
        f.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.email && f.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const balance = f.balanceMinor || f.netBalanceMinor || 0;
      let matchesFilter = true;
      if (filter === 'owed') matchesFilter = balance > 0;
      else if (filter === 'owe') matchesFilter = balance < 0;
      else if (filter === 'settled') matchesFilter = balance === 0;

      return matchesSearch && matchesFilter;
    });
  }, [friends, searchQuery, filter]);

  const counts = useMemo(() => {
    if (!friends) return { all: 0, owed: 0, owe: 0, settled: 0 };
    let owed = 0;
    let owe = 0;
    let settled = 0;
    friends.forEach((f: any) => {
      const b = f.balanceMinor || f.netBalanceMinor || 0;
      if (b > 0) owed++;
      else if (b < 0) owe++;
      else settled++;
    });
    return { all: friends.length, owed, owe, settled };
  }, [friends]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <View>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.text, fontSize: typography.fontSize['2xl'] },
            ]}
          >
            Friends
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            {friends ? `${friends.length} active connection${friends.length === 1 ? '' : 's'}` : 'Track mutual balances'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setQrSheetVisible(true)}
            style={({ pressed }) => [
              styles.qrBtn,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="qr-code-outline" size={16} color={theme.text} style={{ marginRight: 5 }} />
              <Text style={{ fontSize: 12, color: theme.text, fontWeight: '700' }}>My ID</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setAddSheetVisible(true)}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="person-add-outline" size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.addBtnText}>Add</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Search & Status Filters */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search by name or email..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Status Filters */}
        <SegmentedControl
          value={filter}
          onChange={(val) => setFilter(val as any)}
          options={[
            { value: 'all', label: 'All', badge: counts.all },
            { value: 'owed', label: 'Owed', badge: counts.owed },
            { value: 'owe', label: 'You Owe', badge: counts.owe },
            { value: 'settled', label: 'Settled', badge: counts.settled },
          ]}
          style={{ marginTop: 10 }}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Pending Requests Banner */}
        {pendingRequests && pendingRequests.length > 0 && (
          <View style={styles.pendingSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={[styles.notificationDot, { backgroundColor: theme.primary }]} />
              <Text
                style={[
                  styles.pendingHeaderTitle,
                  { color: theme.text, fontSize: typography.fontSize.xs },
                ]}
              >
                PENDING FRIEND REQUESTS ({pendingRequests.length})
              </Text>
            </View>

            {pendingRequests.map((req: any) => (
              <Card
                key={req.id}
                variant="outlined"
                padding="md"
                style={{
                  marginBottom: spacing.sm,
                  borderColor: theme.primary,
                  backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5',
                }}
              >
                <View style={styles.reqRow}>
                  <Avatar name={req.sender?.fullName || 'Friend'} size="md" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={[
                        styles.reqName,
                        { color: theme.text, fontSize: typography.fontSize.base },
                      ]}
                    >
                      {req.sender?.fullName}
                    </Text>
                    <Text
                      style={[
                        styles.reqEmail,
                        { color: theme.textMuted, fontSize: typography.fontSize.xs, marginTop: 2 },
                      ]}
                    >
                      {req.sender?.email}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={() => handleRespond(req.id, 'reject')}
                      style={({ pressed }) => [
                        styles.declineBtn,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 12, color: theme.textMuted, fontWeight: '600' }}>
                        Decline
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleRespond(req.id, 'accept')}
                      style={({ pressed }) => [
                        styles.acceptBtn,
                        { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '700' }}>
                        Accept
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Friends List */}
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filteredFriends && filteredFriends.length > 0 ? (
          filteredFriends.map((friend: any) => {
            const balanceMinor = friend.balanceMinor || friend.netBalanceMinor || 0;
            const isPositive = balanceMinor > 0;
            const isNegative = balanceMinor < 0;

            return (
              <Pressable
                key={friend.id}
                onPress={() => router.push(`/friend/${friend.id}`)}
                style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
              >
                <Card
                  variant="outlined"
                  padding="md"
                  style={{ marginBottom: 10 }}
                >
                  <View style={styles.friendRow}>
                    <Avatar name={friend.fullName} size="md" />
                    <View style={styles.friendInfo}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.friendName,
                          { color: theme.text, fontSize: typography.fontSize.base },
                        ]}
                      >
                        {friend.fullName}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.friendEmail,
                          { color: theme.textMuted, fontSize: typography.fontSize.xs, marginTop: 2 },
                        ]}
                      >
                        {friend.email}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                      <BalancePill
                        amountMinor={balanceMinor}
                        currency={friend.defaultCurrency || currentUser?.defaultCurrency || 'INR'}
                      />
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '600',
                          marginTop: 4,
                          color: isPositive
                            ? theme.positive
                            : isNegative
                            ? theme.negative
                            : theme.textMuted,
                        }}
                      >
                        {isPositive
                          ? 'owes you'
                          : isNegative
                          ? 'you owe'
                          : 'all settled'}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={theme.textMuted}
                      style={{ marginLeft: 6 }}
                    />
                  </View>
                </Card>
              </Pressable>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#D1FAE5',
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              <Ionicons name="people-outline" size={44} color={theme.primary} />
            </View>
            <Text
              style={[
                styles.emptyTitle,
                { color: theme.text, fontSize: typography.fontSize.lg },
              ]}
            >
              {searchQuery ? 'No friends match your filter' : 'No friends connected yet'}
            </Text>
            <Text
              style={[
                styles.emptyDesc,
                { color: theme.textMuted, fontSize: typography.fontSize.sm },
              ]}
            >
              {searchQuery
                ? 'Try a different search query or reset the filter pill.'
                : 'Connect with friends to easily track mutual dinner bills, cab rides, and rent.'}
            </Text>
            {!searchQuery && (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <Button
                  label="Add Friend"
                  onPress={() => setAddSheetVisible(true)}
                  variant="primary"
                  icon={<Ionicons name="person-add-outline" size={16} color="#FFFFFF" />}
                />
                <Button
                  label="Share Link"
                  onPress={handleShareInvite}
                  variant="outline"
                  icon={<Ionicons name="share-social-outline" size={16} color={theme.text} />}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Friend Bottom Sheet */}
      <BottomSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        title="Add Friend on MatrixSplit"
      >
        <View style={styles.sheetContent}>
          <Input
            label="Search by Email or Name"
            placeholder="e.g. bob@matrixsplit.com"
            value={addSearchText}
            onChangeText={handleSearchUsers}
            autoCapitalize="none"
            leftIcon={<Ionicons name="search-outline" size={18} color={theme.textMuted} />}
          />

          {searching ? (
            <Text style={{ color: theme.textMuted, fontSize: 12, marginVertical: 8 }}>
              Searching directory...
            </Text>
          ) : searchResults && searchResults.length > 0 ? (
            <View style={{ marginVertical: 8 }}>
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: typography.fontSize.xs,
                  fontWeight: '700',
                  marginBottom: 8,
                  letterSpacing: 0.5,
                }}
              >
                MATCHING USERS ({searchResults.length})
              </Text>
              {searchResults.map((u: any) => (
                <View
                  key={u.id}
                  style={[
                    styles.searchResultRow,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                >
                  <Avatar name={u.fullName} size="sm" />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>
                      {u.fullName}
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                      {u.email}
                    </Text>
                  </View>
                  <Button
                    label="Send Invite"
                    size="sm"
                    variant="primary"
                    onPress={() => handleSendRequest(u.email || u.id)}
                  />
                </View>
              ))}
            </View>
          ) : addSearchText.length > 1 ? (
            <View style={{ marginVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 8 }}>
                No registered user found with that email.
              </Text>
              <Button
                label="Send Request Anyway"
                size="sm"
                variant="outline"
                onPress={() => handleSendRequest(addSearchText.trim())}
              />
            </View>
          ) : null}

          <View style={[styles.sheetDivider, { backgroundColor: theme.border }]} />

          <Button
            label="Share My MatrixSplit Invite Link"
            variant="outline"
            fullWidth
            onPress={handleShareInvite}
            icon={<Ionicons name="share-social-outline" size={16} color={theme.text} />}
          />
        </View>
      </BottomSheet>

      {/* QR Code Bottom Sheet */}
      <BottomSheet
        visible={qrSheetVisible}
        onClose={() => setQrSheetVisible(false)}
        title="Your MatrixSplit ID"
      >
        <View style={styles.qrSheetContent}>
          <View
            style={[
              styles.qrBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderRadius: borderRadius.xl,
              },
            ]}
          >
            <View style={[styles.qrIconWrap, { backgroundColor: theme.primary }]}>
              <Ionicons name="qr-code" size={54} color="#FFFFFF" />
            </View>
            <Text style={[styles.qrName, { color: theme.text }]}>
              {currentUser?.fullName}
            </Text>
            <Text style={[styles.qrEmail, { color: theme.textMuted }]}>
              {currentUser?.email}
            </Text>
          </View>

          <Button
            label="Share Invite Link"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleShareInvite}
            icon={<Ionicons name="share-social-outline" size={18} color="#FFFFFF" />}
            style={{ marginTop: 16 }}
          />
        </View>
      </BottomSheet>
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
    paddingBottom: 8,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  pendingSection: {
    marginBottom: 16,
  },
  notificationDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  pendingHeaderTitle: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reqName: {
    fontWeight: '700',
  },
  reqEmail: {},
  declineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  acceptBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  friendEmail: {},
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyDesc: {
    textAlign: 'center',
    lineHeight: 20,
  },
  sheetContent: {
    paddingTop: 8,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  sheetDivider: {
    height: 1,
    marginVertical: 14,
  },
  qrSheetContent: {
    alignItems: 'center',
    paddingTop: 8,
  },
  qrBox: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    width: '100%',
  },
  qrIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  qrName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  qrEmail: {
    fontSize: 13,
  },
});
