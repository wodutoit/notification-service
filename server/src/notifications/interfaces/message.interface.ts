import { EVENT_TYPE } from './event-type.interface';
import * as azure from 'azure-storage';
import {MessageBody} from './message-body.interface';

export class EventMessage {
    messageid: string;
    eventtype: string;
    resourcetype: string;
    resourceid: string; //payment id, beneficiary id etc.
    status: string;

    static parseMessage(eventtype:string, queueMessage: azure.QueueService.QueueMessageResult): EventMessage {
        //need to process the message body which should be a JSON 
        //string and pull the resource id and status from it
        let msg: EventMessage = undefined;
        try {
            const messageBody = Buffer.from(queueMessage.messageText, 'base64').toString();
            const body: MessageBody = JSON.parse(messageBody);
            msg = {
                messageid: queueMessage.messageId,
                eventtype: eventtype,
                resourcetype: body.resourcetype,
                resourceid: body.resourceid,
                status: body.status
            };
        } catch(err) {
            //error processing the message
        }
        return msg;
    }



    
             
}