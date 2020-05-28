import { Injectable } from '@nestjs/common';
import { MutexResource } from './interfaces/mutex-resource.interface';
import { MutexResult, MutexResultFactory } from './interfaces/mutex-result.interface';
import { MutexUser } from './interfaces/mutex-user.interface';

@Injectable()
export class MutexService {
    private _resources: MutexResource[] = [];

    lock(resource:MutexResource): MutexResult {
        let result:MutexResult = MutexResultFactory.getSuccessResult();
        try {
            if(!this.isLocked(resource)) {
                resource.locked = true;
                result.Resource = resource;
                this._resources.push(resource);
            } else {
                const lockedby = this.lockedBy(resource);
                result = MutexResultFactory.getLockFailureResult(`Resource is already locked by: ${lockedby ? lockedby.userId : "unknown"}`);
                result.Resource = lockedby;
            }
        } catch (err) {
            //something unrelated went wrong
            result = MutexResultFactory.getErrorResult(err);
        }
        return result;
    }

    unlock(resource: MutexResource): MutexResult {
        let result:MutexResult = MutexResultFactory.getSuccessResult();
        try {
            //we will try remove we don't care if it was actually locked
            let removed = this.removeLocked(resource);
            if(removed) {
                resource.locked = false;
                result.Resource = resource;
            } else {
                const lockedby:MutexResource = this.lockedBy(resource);
                if(lockedby) {
                    result = MutexResultFactory.getLockFailureResult(`Resource is already locked by: ${lockedby.userId}`);
                    result.Resource = lockedby;
                }
                else {
                    result = MutexResultFactory.getLockFailureResult("Resource is not locked, therefore unable to release the lock.");
                }
            }
        } catch (err) {
            //something unrelated went wrong
            result = MutexResultFactory.getErrorResult(err);
        }
        return result;
    }

    releaseAll(user:MutexUser):MutexResource[] {
        const result:MutexResource[] = [];
        let index = 0;
        while(index > -1) {
            index = this._resources.findIndex(lock => lock.socketId === user.socketId && lock.userId === user.userId && lock.clientId === user.clientId);
            if(index > -1) {
                result.push(this._resources[index]);
                this._resources.splice(index, 1);
            }
        }
        return result;
    }

    lockCount() :Number {
        return this._resources.length;
    }

    userLockCount(user:MutexUser):Number {
        let count = 0;
        for (const lock of this._resources) {
            if(lock.userId === user.userId && lock.clientId === user.clientId) {
                count++;
            }
        }
        return count;
    }

    private isLocked(resource:MutexResource): boolean {
        //check if the current resource is in the resources collection if so return false
        const index = this._resources.findIndex(res => res.clientId === resource.clientId && res.resource === resource.resource && res.resourceId === resource.resourceId);
        return index > -1 ? true : false;
    }

    private lockedBy(resource:MutexResource): MutexResource {
        const index = this._resources.findIndex(res => res.clientId === resource.clientId && res.resource === resource.resource && res.resourceId === resource.resourceId);
        return index > -1 ? this._resources[index] : undefined;
    }

    private removeLocked(resource: MutexResource): boolean {
        //can only inlock if you locked it
        let result = false;
        const index = this._resources.findIndex(res => res.socketId === resource.socketId && res.clientId === resource.clientId && res.userId === resource.userId && res.resource === resource.resource && res.resourceId === resource.resourceId);
        if(index != -1) {
            this._resources.splice(index, 1);
            result = true;
        }
        return result;
    }

    printLocks():void {
        //console.log(`Lock count: ${this.lockCount()}`);
        for(const lock of this._resources) {
            //console.log(`Lock { socketid: ${lock.socketId}, userid: ${lock.userId}, resourceid: ${lock.resourceId}`);
        }
    }
}