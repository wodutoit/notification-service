import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ ConfigModule ],
    providers: [ NotificationService, NotificationGateway ]
})
export class NotificationModule {}