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
import { SwarmMetrics, ControlCommand } from './monitoring.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'enrichment',
})
export class EnrichmentGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger = new Logger('EnrichmentGateway');

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    sendProgress(websetId: string, data: any) {
        this.server.emit(`progress:${websetId}`, data);
    }

    sendCellUpdate(websetId: string, cell: any) {
        this.server.emit(`cell:updated:${websetId}`, cell);
    }

    broadcastMetrics(metrics: SwarmMetrics) {
        this.server.emit('metrics:update', metrics);
    }

    broadcastControlEvent(event: any) {
        this.server.emit('control:event', event);
    }

    @SubscribeMessage('control:command')
    handleControlCommand(
        @MessageBody() command: ControlCommand,
        @ConnectedSocket() client: Socket,
    ) {
        this.logger.log(`Received control command from ${client.id}: ${command.command}`);

        // Emit the command to be handled by the service
        this.server.emit('control:received', command);
    }

    @SubscribeMessage('request:metrics')
    handleMetricsRequest(@ConnectedSocket() client: Socket) {
        this.logger.log(`Metrics request from ${client.id}`);
        // Metrics are broadcasted periodically, client will receive them automatically
    }

    @SubscribeMessage('request:agent-status')
    handleAgentStatusRequest(@ConnectedSocket() client: Socket) {
        this.logger.log(`Agent status request from ${client.id}`);
        // This would trigger sending agent status to the requesting client
        this.server.to(client.id).emit('agent:status-response', {});
    }
}
