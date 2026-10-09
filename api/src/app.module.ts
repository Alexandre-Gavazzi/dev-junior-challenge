import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { CheckinsModule } from './checkins/checkins.module.js';

@Module({
  imports: [CheckinsModule],
  controllers: [AppController],
})
export class AppModule {}
