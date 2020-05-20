import * as azure from 'azure-storage';
import { emit } from 'cluster';
import { EventEmitter } from 'events'

interface IQueueListener {
    listen(queueName: string):void;
    stop():void;
}

export const EMIT_EVENTS = {
    MESSAGE: 'message',
    ERROR: 'error'
};

export class QueueListener 
    extends EventEmitter 
    implements IQueueListener  {
    
    private queueService: azure.QueueService;
    private queueName: string = 'sample'; 
    private interval: NodeJS.Timer;
    private maxInterval: number = 13; //so max is 2^13 == 8192 (just over 8 seconds)
    private timeout:number = 1;

    constructor(timeout:number = 1, readonly numMessages:number = 1, queueService:azure.QueueService) {
        super();
        this.timeout = timeout;
        this.queueService = queueService;
    }
    
    listen(name: string) {
        //we only want to connect to existing queues and not create random 
        //queues if they don't exist.
        //an error will be emitted if the queue does not exist.
        this.queueName = name;
        this.resetInterval();
    }
    stop() {
        clearInterval(this.interval);
    }
    private resetInterval():void {
        clearInterval(this.interval);
        const ms = Math.pow(2,this.timeout);
        this.interval = setInterval(this.getMessages.bind(this), ms);
    }
    private adjustInterval(messageCount:number): void {
        if (messageCount > 0 && this.timeout > 0) {
            this.timeout--;
            this.resetInterval();
        } else if (messageCount < 1 && this.timeout < this.maxInterval) {
            this.timeout++;
            this.resetInterval();
        }
    }

    private getMessages():void {
        try {
        this.queueService.getMessages(this.queueName, 
            { 
                numOfMessages: this.numMessages, 
                clientRequestTimeoutInMs: 60000, 
                useNagleAlgorithm:true 
            },
            this.callbackfn.bind(this)
            );
        } catch (err) {
            console.log(`major error: ${err}`);
            this.adjustInterval(0);
        }
    }

    callbackfn (error, messages) {
        //error: Error
        //messages: azure.QueueService.QueueMessageResult[]
        
        if(!error) {
            //messages have been found
            //emit the mesages so that whoever is listening can receive them
            for (const msg of messages) {
                this.emit(EMIT_EVENTS.MESSAGE, msg);
            }
            this.adjustInterval(messages.length);
            
        }
        else {
            this.emit(EMIT_EVENTS.ERROR, error);
            this.adjustInterval(0);
        }

    } 
}