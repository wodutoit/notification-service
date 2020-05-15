import { EVENT_TYPE } from './event-type.interface';

export interface EventMessage {
    messageid: string;
    eventtype: EVENT_TYPE;
    resourceid: string; //payment id, beneficiary id etc.
    status: string;
}