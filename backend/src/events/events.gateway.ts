import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Client subscribes to a specific team's room
  @SubscribeMessage('subscribe_team')
  handleSubscribeTeam(
    @MessageBody() teamId: string,
    @ConnectedSocket() client: Socket,
  ) {
    // Leave all current team rooms
    for (const room of client.rooms) {
      if (room !== client.id) client.leave(room);
    }
    client.join(`team:${teamId}`);
    this.logger.log(`Client ${client.id} subscribed to team: ${teamId}`);
    return { event: 'subscribed', data: teamId };
  }

  // Broadcast dashboard update to all clients subscribed to a team
  broadcastDashboard(teamId: string, data: any) {
    this.server.to(`team:${teamId}`).emit('dashboard_update', {
      teamId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast banner message to all clients
  broadcastBanner(message: any) {
    this.server.emit('banner_update', message);
  }
}
