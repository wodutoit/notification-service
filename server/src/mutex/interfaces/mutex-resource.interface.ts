export interface MutexResource {
    clientId: string;
    userId: string;
    resource: string;
    resourceId: string;
    locked?:boolean;
}