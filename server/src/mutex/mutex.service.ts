import { Injectable } from '@nestjs/common';
import { MutexResource } from './interfaces/mutex-resource.interface';
import { MutexResult, MutexResultFactory } from './interfaces/mutex-result.interface';

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
                result = MutexResultFactory.getLockFailureResult(`Resource is already locked by: ${lockedby ? lockedby : ""}`);
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
                const lockedby:string = this.lockedBy(resource);
                if(lockedby) {
                    result = MutexResultFactory.getLockFailureResult(`Resource is already locked by: ${lockedby}`);
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

    releaseAll(userId) {
        let index = 0;
        while(index > -1) {
            index = this._resources.findIndex(lock => lock.userId === userId);
            if(index > -1) {
                this._resources.splice(index, 1);
            }
        }
    }

    lockCount() :Number {
        return this._resources.length;
    }

    userLockCount(userId:string):Number {
        let count = 0;
        for (const lock of this._resources) {
            if(lock.userId === userId) {
                count++;
            }
        }
        return count;
    }

    private isLocked(resource:MutexResource): boolean {
        //check if the current resource is in the resources collection if so return false
        const index = this._resources.findIndex(res => res.resource === resource.resource && res.resourceId === resource.resourceId);
        return index > -1 ? true : false;
    }

    private lockedBy(resource:MutexResource): string {
        const index = this._resources.findIndex(res => res.resource === resource.resource && res.resourceId === resource.resourceId);
        return index > -1 ? this._resources[index].userId : undefined;
    }

    private removeLocked(resource: MutexResource): boolean {
        //can only inlock if you locked it
        let result = false;
        const index = this._resources.findIndex(res =>res.userId === resource.userId && res.resource === resource.resource && res.resourceId === resource.resourceId);
        if(index != -1) {
            this._resources.splice(index, 1);
            result = true;
        }
        return result;
    }

    
}