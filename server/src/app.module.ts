import { Module } from '@nestjs/common';
import { MutexModule } from './mutex/mutex.module';

@Module({
  imports: [MutexModule],
})
export class AppModule {}