import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

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
}
