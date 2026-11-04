import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Card,
  Avatar,
  BalancePill,
  Button,
  Input,
  BottomSheet,
  SkeletonCard,
  useWatermelonTheme,
} from '@matrixsplit/watermelon-ui';
import {
  useFriends,
  usePendingFriendRequests,
  useSendFriendRequest,
  useRespondFriendRequest,
} from '../../src/hooks/useQueries';
import { apiClient } from '../../src/services/api';

export default function FriendsScreen() {
  const router = useRouter();
  const { theme, typography, spacing, borderRadius } = useWatermelonTheme();

  const { data: friends, isLoading, refetch, isRefetching } = useFriends();
  const { data: pendingRequests, refetch: refetchRequests } =
    usePendingFriendRequests();

  const sendRequestMutation = useSendFriendRequest();
  const respondRequestMutation = useRespondFriendRequest();

  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const onRefresh = () => {
    refetch();
    refetchRequests();
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
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
      setSearchQuery('');
      setSearchResults([]);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.headerBar,
          { backgroundColor: theme.surface, borderBottomColor: theme.divider },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            { color: theme.text, fontSize: typography.fontSize['2xl'] },
          ]}
        >
          Friends
        </Text>
        <TouchableOpacity
          onPress={() => setAddSheetVisible(true)}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.addBtnText}>+ Add Friend</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
            <Text
              style={[
                styles.pendingHeaderTitle,
                { color: theme.text, fontSize: typography.fontSize.sm },
              ]}
            >
              FRIEND REQUESTS ({pendingRequests.length})
            </Text>
            {pendingRequests.map((req: any) => (
              <Card
                key={req.id}
                variant="outlined"
                padding="sm"
                style={{ marginBottom: spacing.sm }}
              >
                <View style={styles.requestRow}>
                  <Avatar name={req.sender?.fullName || 'User'} size="sm" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.friendName, { color: theme.text }]}>
                      {req.sender?.fullName}
                    </Text>
                    <Text
                      style={[styles.friendEmail, { color: theme.textMuted }]}
                    >
                      {req.sender?.email}
                    </Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      onPress={() => handleRespond(req.id, 'accept')}
                      style={[
                        styles.reqBtn,
                        { backgroundColor: theme.primary, marginRight: 6 },
                      ]}
                    >
                      <Text style={styles.reqBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRespond(req.id, 'reject')}
                      style={[
                        styles.reqBtn,
                        { backgroundColor: theme.neutralBg },
                      ]}
                    >
                      <Text
                        style={[styles.reqBtnText, { color: theme.textMuted }]}
                      >
                        Decline
                      </Text>
                    </TouchableOpacity>
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
          </>
        ) : friends && friends.length > 0 ? (
          friends.map((friend: any) => (
            <Card
              key={friend.id}
              variant="outlined"
              padding="md"
              style={{ marginBottom: spacing.sm }}
            >
              <View style={styles.friendCardRow}>
                <Avatar name={friend.fullName} size="md" />
                <View style={styles.friendInfo}>
                  <Text
                    style={[
                      styles.friendName,
                      { color: theme.text, fontSize: typography.fontSize.base },
                    ]}
                  >
                    {friend.fullName}
                  </Text>
                  <Text
                    style={[
                      styles.friendEmail,
                      { color: theme.textMuted, fontSize: typography.fontSize.xs },
                    ]}
                  >
                    {friend.email}
                  </Text>
                </View>

                {/* Mutual Balance Pill */}
                <View style={styles.balanceCol}>
                  <BalancePill
                    amountMinor={friend.netBalanceMinor || 0}
                    currency={friend.defaultCurrency || 'INR'}
                  />
                  {friend.netBalanceMinor !== 0 && (
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/settle',
                          params: {
                            targetUserId: friend.id,
                            targetName: friend.fullName,
                            amountMinor: Math.abs(friend.netBalanceMinor),
                          },
                        })
                      }
                      style={{ marginTop: 6 }}
                    >
                      <Text
                        style={{
                          color: theme.primary,
                          fontSize: typography.fontSize.xs,
                          fontWeight: '700',
                        }}
                      >
                        Settle Up ›
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Card>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 44, marginBottom: 10 }}>👥</Text>
            <Text
              style={[
                styles.emptyTitle,
                { color: theme.text, fontSize: typography.fontSize.lg },
              ]}
            >
              No friends added yet
            </Text>
            <Text
              style={[
                styles.emptyDesc,
                { color: theme.textMuted, fontSize: typography.fontSize.sm },
              ]}
            >
              Search by name or email to add friends and split individual bills
              with zero fuss.
            </Text>
            <Button
              label="+ Add Friends"
              onPress={() => setAddSheetVisible(true)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}
      </ScrollView>

      {/* Add Friend Bottom Sheet */}
      <BottomSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        title="Find & Add Friends"
      >
        <Input
          label="Search by Name or Email"
          placeholder="e.g. bob@matrixsplit.com"
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />

        {searchResults.length > 0 ? (
          <View style={{ marginTop: 12 }}>
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 12,
                fontWeight: '600',
                marginBottom: 8,
              }}
            >
              SEARCH RESULTS
            </Text>
            {searchResults.map((u) => (
              <View
                key={u.id}
                style={[
                  styles.searchResultRow,
                  { borderBottomColor: theme.divider },
                ]}
              >
                <Avatar name={u.fullName} size="sm" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.friendName, { color: theme.text }]}>
                    {u.fullName}
                  </Text>
                  <Text
                    style={[styles.friendEmail, { color: theme.textMuted }]}
                  >
                    {u.email}
                  </Text>
                </View>
                <Button
                  label="Add"
                  size="sm"
                  variant="primary"
                  onPress={() => handleSendRequest(u.email)}
                  loading={sendRequestMutation.isPending}
                />
              </View>
            ))}
          </View>
        ) : searchQuery.length > 1 && !searching ? (
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <Text style={{ color: theme.textMuted }}>No users found.</Text>
            <Button
              label={`Send invite to ${searchQuery}`}
              size="sm"
              variant="outline"
              onPress={() => handleSendRequest(searchQuery)}
              style={{ marginTop: 10 }}
            />
          </View>
        ) : null}
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  pendingSection: {
    marginBottom: 16,
  },
  pendingHeaderTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestActions: {
    flexDirection: 'row',
  },
  reqBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  reqBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  friendCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontWeight: '700',
  },
  friendEmail: {
    marginTop: 2,
  },
  balanceCol: {
    alignItems: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyTitle: {
    fontWeight: '700',
  },
  emptyDesc: {
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 280,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
});
