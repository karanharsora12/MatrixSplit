import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
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
  useWatermelonTheme,
} from '@matrixsplit/watermelon-ui';
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
  const { theme, typography, spacing, borderRadius } = useWatermelonTheme();
  const currentUser = useAuthStore((s) => s.user);

  const { data: friends, isLoading, refetch, isRefetching } = useFriends();
  const { data: pendingRequests, refetch: refetchRequests } =
    usePendingFriendRequests();

  const sendRequestMutation = useSendFriendRequest();
  const respondRequestMutation = useRespondFriendRequest();

  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [qrSheetVisible, setQrSheetVisible] = useState(false);
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

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.text, fontSize: typography.fontSize['2xl'] },
          ]}
        >
          Friends
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setQrSheetVisible(true)}
            style={[styles.qrBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="qr-code-outline" size={16} color={theme.text} style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600' }}>QR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setAddSheetVisible(true)}
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="person-add-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.addBtnText}>Add Friend</Text>
          </TouchableOpacity>
        </View>
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
            <TouchableOpacity
              key={friend.id}
              activeOpacity={0.8}
              onPress={() => router.push(`/friend/${friend.id}`)}
            >
              <Card
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
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: theme.primaryLight, borderRadius: borderRadius.full },
              ]}
            >
              <Ionicons name="people-outline" size={48} color={theme.primary} />
            </View>
            <Text
              style={[
                styles.emptyTitle,
                { color: theme.text, fontSize: typography.fontSize.xl },
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
              Connect with your friends to split bills, share rent, track group
              vacations, and settle up easily.
            </Text>
            <Button
              label="+ Add Your First Friend"
              onPress={() => setAddSheetVisible(true)}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        )}
      </ScrollView>

      {/* Add Friend Bottom Sheet */}
      <BottomSheet
        visible={addSheetVisible}
        onClose={() => {
          setAddSheetVisible(false);
          setSearchQuery('');
          setSearchResults([]);
        }}
        title="Add Friend"
      >
        <View style={styles.sheetContent}>
          <Input
            label="Search by Name or Email"
            placeholder="e.g. bob@matrixsplit.com"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />

          {searching && (
            <Text style={{ color: theme.textMuted, marginVertical: 8 }}>
              Searching MatrixSplit directory...
            </Text>
          )}

          {searchResults.length > 0 && (
            <View style={styles.searchResultsList}>
              {searchResults.map((usr: any) => (
                <View
                  key={usr.id}
                  style={[
                    styles.searchResultRow,
                    { borderBottomColor: theme.divider },
                  ]}
                >
                  <Avatar name={usr.fullName} size="sm" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.searchUserName, { color: theme.text }]}>
                      {usr.fullName}
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                      {usr.email}
                    </Text>
                  </View>
                  <Button
                    label="Send Request"
                    size="sm"
                    variant="outline"
                    onPress={() => handleSendRequest(usr.id)}
                  />
                </View>
              ))}
            </View>
          )}

          {searchQuery.includes('@') && searchResults.length === 0 && !searching && (
            <Button
              label={`Invite ${searchQuery}`}
              size="md"
              variant="primary"
              onPress={() => handleSendRequest(searchQuery)}
              style={{ marginTop: spacing.md }}
            />
          )}

          <Button
            label="Share My Invite Link"
            size="md"
            variant="ghost"
            onPress={handleShareInvite}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </BottomSheet>

      {/* My QR Code Bottom Sheet */}
      <BottomSheet
        visible={qrSheetVisible}
        onClose={() => setQrSheetVisible(false)}
        title="My Friend QR Code"
      >
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <View
            style={[
              styles.qrBox,
              { backgroundColor: '#FFFFFF', borderColor: theme.border },
            ]}
          >
            <Ionicons name="qr-code" size={130} color="#0F172A" />
          </View>

          <Text
            style={[
              styles.qrName,
              { color: theme.text, fontSize: typography.fontSize.lg },
            ]}
          >
            {currentUser?.fullName}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>
            {currentUser?.email}
          </Text>
          <Text
            style={{
              color: theme.textMuted,
              fontSize: 12,
              textAlign: 'center',
              marginTop: 12,
              paddingHorizontal: 24,
            }}
          >
            Friends can scan this QR code or search your email to connect instantly on MatrixSplit.
          </Text>

          <Button
            label="Share My Code"
            size="md"
            variant="primary"
            onPress={handleShareInvite}
            style={{ marginTop: spacing.lg, width: '100%' }}
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
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
    paddingVertical: 6,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDesc: {
    textAlign: 'center',
    lineHeight: 20,
  },
  sheetContent: {
    paddingBottom: 20,
  },
  searchResultsList: {
    marginTop: 10,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchUserName: {
    fontWeight: '600',
    fontSize: 13,
  },
  qrBox: {
    width: 180,
    height: 180,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrName: {
    fontWeight: '800',
    marginTop: 8,
  },
});
