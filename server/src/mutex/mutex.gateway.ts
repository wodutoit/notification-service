import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, WsResponse, ConnectedSocket } from '@nestjs/websockets';
import { from, Observable } from 'rxjs';
import { MutexService } from './mutex.service';
import { MutexResource } from './interfaces/mutex-resource.interface';
import { MutexResult } from './interfaces/mutex-result.interface';
import { Socket } from 'socket.io';
import { MutexUser } from './interfaces/mutex-user.interface';

@WebSocketGateway()
export class MutexGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server;
    users: MutexUser[] = [];

    constructor(private mutexService: MutexService) {}
    
    async handleConnection(client: Socket){

        // A client has connected
        const newUser:MutexUser = {
            socketId: client.id,
            clientId: client.handshake.query.clientId,
            userId:client.handshake.query.userId
        };
        const index = this.users.findIndex(usr => usr.socketId === newUser.socketId);
        if(index == -1) {
            this.users.push(newUser);
        } else {
            this.users[index].clientId = newUser.clientId;
            this.users[index].userId = newUser.userId;
        }
        // Notify connected clients of current users
        //console.log(`Newuser clientId: ${newUser.clientId} and userid: ${newUser.userId}`);
        //console.log(`User Added. User Count: ${this.users.length} | total locks: ${this.mutexService.lockCount()} |  lock count: ${this.mutexService.userLockCount(newUser)}`);
        this.server.emit('userCount', this.users.length);
    }

    async handleDisconnect(client: Socket){

        // A client has disconnected
        const index = this.users.findIndex(usr => usr.socketId === client.id);
        let lockCount: Number = 0;
        let afterlockCount: Number = 0;
        if(index > -1) {
            lockCount = this.mutexService.userLockCount(this.users[index]);
            const unlocked: MutexResource[] = this.mutexService.releaseAll(this.users[index]);
            for (const lock of unlocked) {
                this.server.emit('unlocked', lock);
            }
            afterlockCount = this.mutexService.userLockCount(this.users[index]);
            this.users.splice(index, 1);
        }
        // Notify connected clients of current users
        //console.log(`User Removed. User Count: ${this.users.length} | total locks: ${this.mutexService.lockCount()} |  orig lock count: ${lockCount} | after ${afterlockCount}`);
        this.mutexService.printLocks();
        this.server.emit('userCount', this.users.length);

    }
    
    @SubscribeMessage('lock')
    onLock(@ConnectedSocket() client:Socket, @MessageBody() resource: MutexResource): MutexResult {
        const updatedResource = resource;
        updatedResource.socketId = client.id;
        const result = this.mutexService.lock(updatedResource);
        //console.log(`server received resource lock request ${result.Success} clientid: ${client.id}`);
        if(result.Success) {
            //console.log(`lock request successful ${resource}`);
            this.server.emit('locked', resource);
        }
        return result;
    }

    @SubscribeMessage('unlock')
    onUnLock(@ConnectedSocket() client:Socket, @MessageBody() resource: MutexResource): MutexResult {
        const updatedResource = resource;
        updatedResource.socketId = client.id;
        const result = this.mutexService.unlock(updatedResource);
        //console.log(`server received resource Unlock request ${resource}`);
        if(result.Success) {
            //console.log(`unlock request successful ${resource}`);
            this.server.emit('unlocked', resource);
        }
        return result;
    }
}