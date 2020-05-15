import { MutexResource } from './mutex-resource.interface';

export interface MutexResult {
    Error: boolean;
    Message: string;
    LockFailed: boolean;
    Success: boolean;
    Resource?: MutexResource;
}

enum State {
    Error = 0,
    Success,
    LockFailure
    }  

export class MutexResultFactory {
      
    private static getBaseResult(): MutexResult {
        return {
            Error: false,
            LockFailed: false,
            Success: true,
            Message: '',
            Resource: undefined
        };
    }

    static getErrorResult(message:string): MutexResult {
        const res = this.setState(State.Error, this.getBaseResult());
        res.Message = message;
        return res;
    }

    static getLockFailureResult(message:string): MutexResult {
        const res = this.setState(State.LockFailure, this.getBaseResult());
        res.Message = message;
        return res;
    }

    static getSuccessResult(): MutexResult {
        const res = this.setState(State.Success, this.getBaseResult());
        return res;
    }

    private static setState(state: State, result: MutexResult): MutexResult {
        switch(state) {
            case State.Error:
                result.Error = true;
                result.LockFailed = result.Success = !result.Error;
                break;
            case State.LockFailure:
                result.LockFailed = true;
                result.Error = result.Success = !result.LockFailed;
                break;
            case State.Success:
                result.Success = true;
                result.Error = result.LockFailed = !result.Success;
                break;
        }
        return result;
    }
}