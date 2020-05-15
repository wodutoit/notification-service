export interface MutexResource {
    userId: string;
    resource: string;
    resourceId: string;
    locked?:boolean;
}