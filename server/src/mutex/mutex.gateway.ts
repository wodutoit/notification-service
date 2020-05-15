import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, WsResponse } from '@nestjs/websockets';
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
            userId:client.handshake.query.userId
        };
        const index = this.users.findIndex(usr => usr.socketId === newUser.socketId);
        if(index == -1) {
            this.users.push(newUser);
        } else {
            this.users[index].userId = newUser.userId;
        }
        // Notify connected clients of current users
        console.log(`User Added. User Count: ${this.users.length} | total locks: ${this.mutexService.lockCount()} |  lock count: ${this.mutexService.userLockCount(newUser.userId)}`);
        this.server.emit('userCount', this.users.length);
    }

    async handleDisconnect(client: Socket){

        // A client has disconnected
        const index = this.users.findIndex(usr => usr.socketId === client.id);
        let lockCount: Number = 0;
        let afterlockCount: Number = 0;
        if(index > -1) {
            lockCount = this.mutexService.userLockCount(this.users[index].userId);
            this.mutexService.releaseAll(this.users[index].userId);
            afterlockCount = this.mutexService.userLockCount(this.users[index].userId);
            this.users.splice(index, 1);
        }
        // Notify connected clients of current users
        console.log(`User Removed. User Count: ${this.users.length} | total locks: ${this.mutexService.lockCount()} |  orig lock count: ${lockCount} | after ${afterlockCount}`);
        this.server.emit('userCount', this.users.length);

    }
    //not async we don't want parallel execution of locking
    @SubscribeMessage('lock')
    onLock(@MessageBody() resource: MutexResource): MutexResult {
        const result = this.mutexService.lock(resource);
        console.log(`server received resource lock request ${result.Success}`);
        if(result.Success) {
            console.log(`lock request successful ${resource}`);
            this.server.emit('locked', resource);
        }
        return result;
    }

    @SubscribeMessage('unlock')
    onUnLock(@MessageBody() resource: MutexResource): MutexResult {
        const result = this.mutexService.unlock(resource);
        console.log(`server received resource Unlock request ${resource}`);
        if(result.Success) {
            console.log(`unlock request successful ${resource}`);
            this.server.emit('unlocked', resource);
        }
        return result;
    }
}