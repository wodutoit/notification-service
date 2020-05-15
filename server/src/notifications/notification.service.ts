import { Injectable } from '@nestjs/common';
//we need to write our own listener but this works as an example
//the code below doesn't actually work at the moment
import { QueueListener } from 'azure-queue';
import azure from 'azure';
import { ConfigService } from '@nestjs/config';
import { NotificationGateway } from './notification.gateway';
import { EVENT_TYPE } from './interfaces/event-type.interface';
import { EventMessage } from './interfaces/message.interface';

@Injectable()
export class NotificationService {
    private queueService: any;
    private listeners: any[];

    constructor (
        private configService: ConfigService,
        private gateway: NotificationGateway) {}

    start() {
        this.queueService = azure.createQueueService();
        //these need to be asyn calls but we don't wait
        this.startListener(EVENT_TYPE.BENEFICIARY,
            this.configService.get<string>("BENEFICIARY_QUEUE"), 
            this.configService.get<string>("BENEFICIARY_MESSAGE"));
        this.startListener(EVENT_TYPE.INCOMING,
            this.configService.get<string>("INCOMING_QUEUE"), 
            this.configService.get<string>("INCOMING_MESSAGE"));
        this.startListener(EVENT_TYPE.OUTGOING,
            this.configService.get<string>("OUTGOING_QUEUE"), 
            this.configService.get<string>("OUTGOING_MESSAGE"));
    }

    stop() {
        for (const listener of this.listeners) {
            //this doesn't actually work this way
            listener.stop();
        }
    }

    private async startListener(eventtype: EVENT_TYPE, queueName: string, messageName: string) {
        //TODO: This doesn't cater for connecting to azure

        const listener:any = new QueueListener();
        this.listeners.push(listener);
        listener.on(messageName, function(message) {
            //emit this message to the connected frontend clients
            //need to get the resource id from the message and the status
            //I assume there is a data proerty of some sort
            const emitMessage: EventMessage = {
                messageid: message.messageid,
                eventtype: eventtype,
                resourceid: "",
                status: ""
            };
            this.gateway.statusChange(emitMessage);
            // delete the message when done
            this.queueService.deleteMessage(queueName
                        , message.messageid
                        , message.popreceipt
                        , function(error){
                            if(!error){
                                console.log("deleted");
                            }
                        });
        });
        //start listening this shoud be a async call that we don't wait for
        listener.listen(queueName, this.queueService);
    }

    
}