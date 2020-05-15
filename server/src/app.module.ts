import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MutexModule } from './mutex/mutex.module';
import { NotificationModule } from './notifications/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MutexModule,
    NotificationModule
  ],
})
export class AppModule {}