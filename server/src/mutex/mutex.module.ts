import { Module } from '@nestjs/common';
import { MutexGateway } from './mutex.gateway';
import { MutexService } from './mutex.service';

@Module({
    providers: [ MutexService, MutexGateway ]
})
export class MutexModule {}