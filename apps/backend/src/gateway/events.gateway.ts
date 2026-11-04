import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // Client connected
  }

  handleDisconnect(client: Socket) {
    // Client disconnected
  }

  @SubscribeMessage('join_user_room')
  handleJoinUserRoom(client: Socket, userId: string) {
    client.join(`user_${userId}`);
  }

  @SubscribeMessage('join_group_room')
  handleJoinGroupRoom(client: Socket, groupId: string) {
    client.join(`group_${groupId}`);
  }

  emitToUser(userId: string, event: string, payload: any) {
    this.server?.to(`user_${userId}`).emit(event, payload);
  }

  emitToGroup(groupId: string, event: string, payload: any) {
    this.server?.to(`group_${groupId}`).emit(event, payload);
  }

  broadcast(event: string, payload: any) {
    this.server?.emit(event, payload);
  }
}
