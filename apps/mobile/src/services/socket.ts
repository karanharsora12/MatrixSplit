import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from './api';

let socket: Socket | null = null;

export const initSocket = (queryClient: any) => {
  const user = useAuthStore.getState().user;
  if (!user || socket) return;

  const serverUrl = API_BASE_URL.replace('/api/v1', '');
  socket = io(serverUrl, {
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    socket?.emit('join_user_room', user.id);
  });

  // Listen for real-time updates
  socket.on('expense_created', () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['balances'] });
    queryClient.invalidateQueries({ queryKey: ['activities'] });
  });

  socket.on('expense_updated', () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['balances'] });
  });

  socket.on('expense_deleted', () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['balances'] });
  });

  socket.on('settlement_updated', () => {
    queryClient.invalidateQueries({ queryKey: ['settlements'] });
    queryClient.invalidateQueries({ queryKey: ['balances'] });
  });

  socket.on('friend_request_received', () => {
    queryClient.invalidateQueries({ queryKey: ['friends'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  });
};

export const joinGroupSocketRoom = (groupId: string) => {
  socket?.emit('join_group_room', groupId);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
