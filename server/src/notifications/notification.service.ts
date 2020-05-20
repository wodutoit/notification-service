import { Injectable } from '@nestjs/common';
import * as azure from 'azure-storage';
import { ConfigService } from '@nestjs/config';
import { NotificationGateway } from './notification.gateway';
import { EVENT_TYPE } from './interfaces/event-type.interface';
import { EventMessage } from './interfaces/message.interface';
import { QueueListener, EMIT_EVENTS } from './queue/queue.listener';

@Injectable()
export class NotificationService {
    //create this outside the listener so that we only have one connetion to the queue instead of 3 or more
    private queueService: azure.QueueService = undefined; 
    private beneficiaryListener:QueueListener = undefined;
    private incomingListener:QueueListener = undefined;
    private outgoingListener:QueueListener = undefined;
    private gateway: NotificationGateway

    constructor (
        private configService: ConfigService) {}

    start(gatewayObj: NotificationGateway) {
        this.gateway = gatewayObj;
        //these need to be asyn calls but we don't wait
        if(!this.queueService) {
            this.queueService = azure.createQueueService(this.configService.get<string>("AZURE_STORAGE_CONNECTION_STRING"));
        }

        if(!this.beneficiaryListener) {
            this.beneficiaryListener = this.startListener(EVENT_TYPE.BENEFICIARY,
                this.configService.get<string>("BENEFICIARY_QUEUE"));
        }

        if(!this.incomingListener) {
            this.incomingListener = this.startListener(EVENT_TYPE.INCOMING,
                this.configService.get<string>("INCOMING_QUEUE"));
        }

        if(!this.outgoingListener) {
            this.outgoingListener = this.startListener(EVENT_TYPE.OUTGOING,
                this.configService.get<string>("OUTGOING_QUEUE"));
        }
    }

    stop() {
        if(!this.beneficiaryListener) {
            this.beneficiaryListener.stop();
            this.beneficiaryListener = undefined;
        }

        if(!this.incomingListener) {
            this.incomingListener.stop();
            this.incomingListener = undefined;
        }

        if(!this.outgoingListener) {
            this.outgoingListener.stop();
            this.outgoingListener = undefined;
        }
        this.queueService = undefined;
    }

    private startListener(eventtype: string, queueName: string): QueueListener {
        const listener = new QueueListener(5, 16, this.queueService);
        
        listener.on(EMIT_EVENTS.ERROR, function(error){
            //what do you wan to do when an error occurs
            //console.log(`Error code: ${error.code}, message: ${error.message} timestamp: ${Date()}`);
        });

        listener.on(EMIT_EVENTS.MESSAGE, this.onMessage.bind(this, eventtype, queueName) );
        //start listening this shoud be a async call that we don't wait for
        listener.listen(queueName);
        return listener;
    }

    onMessage(eventtype:string, queueName:string, message: azure.QueueService.QueueMessageResult) {
        //emit this message to the connected frontend clients
        //need to get the resource id from the message and the status
        //I assume there is a data proerty of some sort

         //need to process the message body which should be a JSON 
         //string and pull the resource id and status from it
        const emitMessage = EventMessage.parseMessage(eventtype, message);
        
        this.gateway.statusChange(emitMessage);
        // delete the message when done
        this.queueService.deleteMessage(queueName
                    , message.messageId
                    , message.popReceipt
                    , function(error){
                        if(!error){
                            //message was deleted from the queue
                            console.log("deleted");
                        }
                        //do nothing if it fails to delete the message
                    });
    }

    
}