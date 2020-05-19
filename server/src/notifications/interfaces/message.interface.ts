import { EVENT_TYPE } from './event-type.interface';
import * as azure from 'azure-storage';

export class EventMessage {
    messageid: string;
    eventtype: string;
    resourceid: string; //payment id, beneficiary id etc.
    status: string;

    static parseMessage(eventtype:string, queueMessage: azure.QueueService.QueueMessageResult): EventMessage {
        //need to process the message body which should be a JSON 
        //string and pull the resource id and status from it
        const messageBody = Buffer.from(queueMessage.messageText, 'base64').toString();
        const body = JSON.parse(messageBody);
        const msg: EventMessage = {
            messageid: queueMessage.messageId,
            eventtype: eventtype,
            resourceid: body.resourceid,
            status: body.status
        };
        return msg;
    }



    
             
}