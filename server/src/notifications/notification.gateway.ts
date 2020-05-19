import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, WsResponse } from '@nestjs/websockets';
import { from, Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { NotificationService } from './notification.service';
import { EVENT_TYPE } from './interfaces/event-type.interface';
import { EventMessage } from './interfaces/message.interface';

@WebSocketGateway()
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server;
    connCount = 0;

    constructor(
        private notificationService: NotificationService) {}
    
    async handleConnection(client: Socket) {
        //add logic here specific to notification user connection, the socket connection is shared across modules
        //this.server.emit('userCount', this.users.length);

        //if we have any active connections start the listeners
        this.connCount++;
        if(this.connCount == 1) {
            //when the first person connect do the init
            this.notificationService.start(this);
        }
    }

    async handleDisconnect(client: Socket){
        //add logic here specific to notification user connection, the socket connection is shared across modules
        // A client has disconnected
        //this.server.emit('userCount', this.users.length);

        this.connCount--;
        if(this.connCount == 0) {
            this.notificationService.stop();
        }

    }
    //not async we don't want parallel execution of locking
    // @SubscribeMessage('beneficiary')
    // onLock(@MessageBody() msg: string): string {
    //     //having a subscribe means that a client can call this function
    //     const result = "";
    //     this.server.emit('beneficiary-status', result);
    //     return result;
    // }

    statusChange(message:EventMessage): void {
        //this will emit events to all subscribed clients that a message has been recieved
        this.server.emit(message.eventtype, message);
    }
}