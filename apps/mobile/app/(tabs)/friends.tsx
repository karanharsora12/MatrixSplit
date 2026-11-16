import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
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
  Avatar,
  BalancePill,
  Button,
  Input,
  BottomSheet,
  SkeletonCard,
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
import { cn } from '@/lib/utils';
import { formatCurrency } from '@matrixsplit/shared';

export default function FriendsScreen() {
  const router = useRouter();
  const { isDark } = useWatermelonTheme();
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
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className={cn('flex-1', isDark ? 'bg-[#090D16]' : 'bg-[#F8FAFC]')}
    >
      {/* Top Header */}
      <View
        className={cn(
          'flex-row items-center justify-between px-5 pt-2 pb-3.5 border-b',
          isDark ? 'border-[#1E293B]' : 'border-slate-200'
        )}
      >
        <View>
          <Text
            className={cn(
              'text-2xl font-extrabold tracking-tight',
              isDark ? 'text-white' : 'text-slate-900'
            )}
          >
            Friends
          </Text>
          <Text className="text-xs text-slate-400 mt-0.5">
            {friends
              ? `${friends.length} active connection${friends.length === 1 ? '' : 's'}`
              : 'Track mutual balances'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center">
          <Pressable
            onPress={() => setQrSheetVisible(true)}
            className={cn(
              'flex-row items-center h-9 px-3.5 rounded-xl border active:scale-95 mr-2',
              isDark
                ? 'bg-[#141D2E] border-[#23324D] active:bg-[#1E2A42]'
                : 'bg-white border-slate-200 active:bg-slate-100'
            )}
          >
            <Ionicons
              name="qr-code-outline"
              size={16}
              color={isDark ? '#94A3B8' : '#64748B'}
              style={{ marginRight: 4 }}
            />
            <Text
              className={cn(
                'text-xs font-bold',
                isDark ? 'text-slate-200' : 'text-slate-700'
              )}
            >
              My ID
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setAddSheetVisible(true)}
            className="flex-row items-center h-9 px-3.5 rounded-xl bg-emerald-500 active:scale-95 active:bg-emerald-600 shadow-sm"
          >
            <Ionicons
              name="person-add-outline"
              size={15}
              color="#FFFFFF"
              style={{ marginRight: 4 }}
            />
            <Text className="text-xs font-bold text-white">Add</Text>
          </Pressable>
        </View>
      </View>

      {/* Search & Status Filters */}
      <View className="pt-3.5">
        {/* Search Bar */}
        <View
          className={cn(
            'flex-row items-center h-11 px-3.5 rounded-2xl border mx-5 mb-3',
            isDark
              ? 'bg-[#141D2E] border-[#23324D]'
              : 'bg-white border-slate-200 shadow-sm shadow-black/5'
          )}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color="#64748B"
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder="Search by name or email..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className={cn(
              'flex-1 text-sm font-medium py-0',
              isDark ? 'text-white' : 'text-slate-900'
            )}
          />
          {searchQuery ? (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={18} color="#64748B" />
            </Pressable>
          ) : null}
        </View>

        {/* Status Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
        >
          {[
            { key: 'all' as const, label: 'All', badge: counts.all },
            { key: 'owed' as const, label: 'Owed', badge: counts.owed },
            { key: 'owe' as const, label: 'You Owe', badge: counts.owe },
            { key: 'settled' as const, label: 'Settled', badge: counts.settled },
          ].map((item) => {
            const isSelected = filter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                className={cn(
                  'h-9 px-4 rounded-full flex-row items-center justify-center mr-2.5 active:scale-95',
                  isSelected
                    ? 'bg-emerald-500 shadow-sm'
                    : isDark
                    ? 'bg-[#141D2E] border border-[#23324D]'
                    : 'bg-white border border-slate-200'
                )}
              >
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
                  {item.label}
                </Text>
                {item.badge !== undefined && (
                  <View
                    className={cn(
                      'px-1.5 py-0.5 rounded-full ml-1.5',
                      isSelected
                        ? 'bg-white/20'
                        : isDark
                        ? 'bg-[#1E2A42]'
                        : 'bg-slate-100'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-[10px] font-bold',
                        isSelected
                          ? 'text-white'
                          : isDark
                          ? 'text-slate-400'
                          : 'text-slate-600'
                      )}
                    >
                      {item.badge}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="#10B981"
          />
        }
      >
        {/* Pending Requests Banner */}
        {pendingRequests && pendingRequests.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center px-5 mb-2.5">
              <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
              <Text className="text-xs font-bold text-slate-400 tracking-wider">
                PENDING REQUESTS ({pendingRequests.length})
              </Text>
            </View>

            {pendingRequests.map((req: any) => (
              <View
                key={req.id}
                className={cn(
                  'mx-5 mb-2.5 p-3.5 rounded-2xl border flex-row items-center justify-between',
                  isDark
                    ? 'bg-[#141D2E] border-emerald-500/40'
                    : 'bg-emerald-50 border-emerald-300'
                )}
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <Avatar name={req.sender?.fullName || 'Friend'} size="md" />
                  <View className="flex-1 ml-3">
                    <Text
                      numberOfLines={1}
                      className={cn(
                        'text-sm font-bold tracking-tight',
                        isDark ? 'text-white' : 'text-slate-900'
                      )}
                    >
                      {req.sender?.fullName}
                    </Text>
                    <Text className="text-xs text-slate-400">
                      {req.sender?.email}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Pressable
                    onPress={() => handleRespond(req.id, 'reject')}
                    className={cn(
                      'px-3 py-1.5 rounded-xl border mr-2 active:scale-95',
                      isDark
                        ? 'bg-[#1E2A42] border-[#23324D]'
                        : 'bg-white border-slate-200'
                    )}
                  >
                    <Text className="text-xs font-bold text-slate-400">
                      Decline
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRespond(req.id, 'accept')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 active:scale-95 shadow-sm"
                  >
                    <Text className="text-xs font-bold text-white">Accept</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Friends List */}
        {isLoading ? (
          <View className="px-5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : filteredFriends && filteredFriends.length > 0 ? (
          filteredFriends.map((f: any) => {
            const balanceMinor = f.netBalanceMinor || f.balanceMinor || 0;
            const currency = f.defaultCurrency || currentUser?.defaultCurrency || 'INR';
            const isOwed = balanceMinor > 0;
            const isOwe = balanceMinor < 0;

            return (
              <Pressable
                key={f.id}
                onPress={() => router.push(`/friend/${f.id}`)}
                className={cn(
                  'mx-5 mb-2.5 p-3.5 rounded-2xl border flex-row items-center justify-between active:scale-98',
                  isDark
                    ? 'bg-[#141D2E] border-[#23324D] active:bg-[#1A263B]'
                    : 'bg-white border-slate-200 active:bg-slate-50 shadow-sm shadow-black/5'
                )}
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <Avatar name={f.fullName} size="md" />
                  <View className="ml-3 flex-1">
                    <Text
                      numberOfLines={1}
                      className={cn(
                        'text-sm font-bold tracking-tight',
                        isDark ? 'text-white' : 'text-slate-900'
                      )}
                    >
                      {f.fullName}
                    </Text>
                    <Text className="text-xs text-slate-400 mt-0.5">
                      {f.email || 'Connected'}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <View className="items-end mr-2">
                    {balanceMinor !== 0 ? (
                      <>
                        <Text
                          className={cn(
                            'text-sm font-extrabold font-mono',
                            isOwed ? 'text-emerald-400' : 'text-rose-400'
                          )}
                        >
                          {formatCurrency(Math.abs(balanceMinor), currency)}
                        </Text>
                        <Text
                          className={cn(
                            'text-[10px] font-bold mt-0.5',
                            isOwed ? 'text-emerald-500' : 'text-rose-500'
                          )}
                        >
                          {isOwed ? 'owes you' : 'you owe'}
                        </Text>
                      </>
                    ) : (
                      <Text className="text-xs font-semibold text-slate-400">
                        Settled
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748B" />
                </View>
              </Pressable>
            );
          })
        ) : (
          <View
            className={cn(
              'mx-5 my-10 p-8 rounded-3xl border items-center',
              isDark ? 'bg-[#141D2E] border-[#23324D]' : 'bg-white border-slate-200 shadow-sm'
            )}
          >
            <View className="w-16 h-16 rounded-full bg-emerald-500/15 items-center justify-center mb-3">
              <Ionicons name="people-outline" size={32} color="#10B981" />
            </View>
            <Text
              className={cn(
                'text-base font-bold mt-1',
                isDark ? 'text-white' : 'text-slate-900'
              )}
            >
              {searchQuery ? 'No friends found' : 'No friends connected yet'}
            </Text>
            <Text className="text-xs text-slate-400 text-center mt-1 leading-5 max-w-[270px]">
              {searchQuery
                ? 'Try a different search query or clear your filter'
                : 'Connect with friends to easily track mutual dinner bills, cab rides, and rent.'}
            </Text>

            <View className="flex-row items-center mt-5">
              <Pressable
                onPress={() => setAddSheetVisible(true)}
                className="flex-row items-center h-10 px-4 rounded-xl bg-emerald-500 active:scale-95 active:bg-emerald-600 mr-2 shadow-sm"
              >
                <Ionicons
                  name="person-add-outline"
                  size={15}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text className="text-xs font-bold text-white">Add Friend</Text>
              </Pressable>
              <Pressable
                onPress={handleShareInvite}
                className={cn(
                  'flex-row items-center h-10 px-4 rounded-xl border active:scale-95',
                  isDark
                    ? 'bg-[#1E2A42] border-[#23324D] active:bg-[#253554]'
                    : 'bg-slate-100 border-slate-200 active:bg-slate-200'
                )}
              >
                <Ionicons
                  name="share-social-outline"
                  size={15}
                  color={isDark ? '#94A3B8' : '#475569'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  className={cn(
                    'text-xs font-bold',
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  )}
                >
                  Share Link
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Friend Bottom Sheet */}
      <BottomSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        title="Add Friend on MatrixSplit"
      >
        <View className="py-1">
          <Input
            label="Search by Email or User ID"
            placeholder="friend@example.com"
            value={addSearchText}
            onChangeText={handleSearchUsers}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {searching && (
            <Text className="text-xs text-slate-400 text-center py-2">
              Searching registered users...
            </Text>
          )}

          {searchResults && searchResults.length > 0 && (
            <View className="mb-3">
              <Text className="text-xs font-bold text-slate-400 tracking-wider mb-2">
                FOUND USERS
              </Text>
              {searchResults.map((user: any) => (
                <View
                  key={user.id}
                  className={cn(
                    'p-3 rounded-2xl border flex-row items-center justify-between mb-2',
                    isDark ? 'bg-[#141D2E] border-[#23324D]' : 'bg-slate-50 border-slate-200'
                  )}
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <Avatar name={user.fullName} size="sm" />
                    <View className="ml-2.5 flex-1">
                      <Text
                        numberOfLines={1}
                        className={cn(
                          'text-xs font-bold',
                          isDark ? 'text-white' : 'text-slate-900'
                        )}
                      >
                        {user.fullName}
                      </Text>
                      <Text className="text-[11px] text-slate-400">
                        {user.email}
                      </Text>
                    </View>
                  </View>
                  <Button
                    label="Connect"
                    size="sm"
                    variant="primary"
                    onPress={() => handleSendRequest(user.id)}
                    loading={sendRequestMutation.isPending}
                  />
                </View>
              ))}
            </View>
          )}

          <Button
            label={
              sendRequestMutation.isPending ? 'Sending Invite...' : 'Send Friend Request'
            }
            size="lg"
            variant="primary"
            fullWidth
            onPress={() => handleSendRequest(addSearchText.trim())}
            loading={sendRequestMutation.isPending}
            disabled={!addSearchText.trim()}
            style={{ marginTop: 14 }}
          />
        </View>
      </BottomSheet>

      {/* QR & Profile ID Bottom Sheet */}
      <BottomSheet
        visible={qrSheetVisible}
        onClose={() => setQrSheetVisible(false)}
        title="Your MatrixSplit ID"
      >
        <View className="items-center py-2">
          <View
            className={cn(
              'w-full p-6 rounded-3xl border items-center mb-4',
              isDark ? 'bg-[#141D2E] border-[#23324D]' : 'bg-slate-50 border-slate-200'
            )}
          >
            <View className="w-20 h-20 rounded-2xl bg-emerald-500/15 items-center justify-center mb-3">
              <Ionicons name="qr-code-outline" size={44} color="#10B981" />
            </View>
            <Text
              className={cn(
                'text-lg font-bold tracking-tight',
                isDark ? 'text-white' : 'text-slate-900'
              )}
            >
              {currentUser?.fullName}
            </Text>
            <Text className="text-xs text-slate-400 mt-0.5">
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
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
