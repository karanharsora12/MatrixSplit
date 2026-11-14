import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import {
  CreateExpenseInput,
  UpdateExpenseInput,
  CreateGroupInput,
  CreateSettlementInput,
  ConfirmSettlementInput,
  SetupProfileInput,
  UserBalanceOverview,
} from '@matrixsplit/shared';

// Balance Queries
export const useBalanceOverview = () => {
  return useQuery<UserBalanceOverview>({
    queryKey: ['balances', 'overview'],
    queryFn: async () => {
      const res = await apiClient.get('/balances/overview');
      return res.data;
    },
  });
};

export const useGroupBalances = (groupId: string) => {
  return useQuery({
    queryKey: ['balances', 'group', groupId],
    queryFn: async () => {
      const res = await apiClient.get(`/balances/group/${groupId}`);
      return res.data;
    },
    enabled: !!groupId,
  });
};

// Groups Queries & Mutations
export const useMyGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await apiClient.get('/groups');
      return res.data;
    },
  });
};

export const useGroupDetails = (groupId: string) => {
  return useQuery({
    queryKey: ['groups', groupId],
    queryFn: async () => {
      const res = await apiClient.get(`/groups/${groupId}`);
      return res.data;
    },
    enabled: !!groupId,
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateGroupInput) => {
      const res = await apiClient.post('/groups', dto);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
  });
};

export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const res = await apiClient.post(`/groups/join/${inviteCode}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, dto }: { groupId: string; dto: any }) => {
      const res = await apiClient.patch(`/groups/${groupId}`, dto);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups', variables.groupId] });
    },
  });
};

// Expenses Queries & Mutations
export const useRecentExpenses = (limit = 10) => {
  return useQuery({
    queryKey: ['expenses', 'recent', limit],
    queryFn: async () => {
      const res = await apiClient.get(`/expenses/recent?limit=${limit}`);
      return res.data;
    },
  });
};

export const useGroupExpenses = (groupId: string) => {
  return useQuery({
    queryKey: ['expenses', 'group', groupId],
    queryFn: async () => {
      const res = await apiClient.get(`/expenses/group/${groupId}`);
      return res.data;
    },
    enabled: !!groupId,
  });
};

export const useExpenseDetails = (expenseId: string) => {
  return useQuery({
    queryKey: ['expenses', expenseId],
    queryFn: async () => {
      const res = await apiClient.get(`/expenses/${expenseId}`);
      return res.data;
    },
    enabled: !!expenseId,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateExpenseInput) => {
      const res = await apiClient.post('/expenses', dto);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateExpenseInput }) => {
      const res = await apiClient.patch(`/expenses/${id}`, dto);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/expenses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
  });
};

// Settlements Queries & Mutations
export const useRecentSettlements = (limit = 10) => {
  return useQuery({
    queryKey: ['settlements', 'recent', limit],
    queryFn: async () => {
      const res = await apiClient.get(`/settlements/recent?limit=${limit}`);
      return res.data;
    },
  });
};

export const useCreateSettlement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateSettlementInput) => {
      const res = await apiClient.post('/settlements', dto);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
};

export const useConfirmSettlement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: ConfirmSettlementInput }) => {
      const res = await apiClient.patch(`/settlements/${id}/confirm`, dto);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
  });
};

// Friends Queries & Mutations
export const useFriends = () => {
  return useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await apiClient.get('/friends');
      return res.data;
    },
  });
};

export const usePendingFriendRequests = () => {
  return useQuery({
    queryKey: ['friends', 'pending'],
    queryFn: async () => {
      const res = await apiClient.get('/friends/requests/pending');
      return res.data;
    },
  });
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (emailOrUserId: string) => {
      const res = await apiClient.post('/friends/request', { emailOrUserId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
};

export const useRespondFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'accept' | 'reject' }) => {
      const res = await apiClient.post(`/friends/requests/${id}/respond`, { action });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
};

// Activities Query
export const useActivities = (limit = 25) => {
  return useQuery({
    queryKey: ['activities', limit],
    queryFn: async () => {
      const res = await apiClient.get(`/activities?limit=${limit}`);
      return res.data;
    },
  });
};

// Notifications Query
export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications');
      return res.data;
    },
  });
};

// Analytics Query
export const useAnalyticsSummary = () => {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/summary');
      return res.data;
    },
  });
};
